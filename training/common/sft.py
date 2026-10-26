"""QLoRA supervised fine-tuning shared by the vision (Qwen3-VL) and text
(Qwen3) models: a 4-bit base model, LoRA adapters on its language layers,
and loss only on the assistant's reply.

Training data is JSONL, one example per line:
    {"system": "...", "user": "...", "assistant": "...", "image": "path or null"}
"""
import json
from pathlib import Path

import torch
from PIL import Image
from torch.utils.data import Dataset

IGNORE = -100
END = '<|im_end|>\n'


def read_jsonl(path):
    with open(path, encoding='utf-8') as f:
        return [json.loads(line) for line in f if line.strip()]


def write_jsonl(path, rows):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + '\n')


def load_image(path, max_side):
    """Opens an image and shrinks it so its longest side is max_side: the
    number of image tokens (and so the VRAM) grows with the pixel count."""
    img = Image.open(path).convert('RGB')
    scale = max_side / max(img.size)
    if scale < 1:
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    return img


def chat_messages(example, image=None):
    user = [{'type': 'text', 'text': example['user']}]
    if image is not None:
        user.insert(0, {'type': 'image', 'image': image})
        system = [{'type': 'text', 'text': example['system']}]
    else:
        user, system = example['user'], example['system']
    return [{'role': 'system', 'content': system}, {'role': 'user', 'content': user}]


class SFTDataset(Dataset):
    """Tokenises one example at a time. The prompt is rendered with the
    model's own chat template (thinking off, as the app runs it) and the
    reply appended, so training sees exactly what Ollama sends at run time."""

    def __init__(self, rows, processor, max_length, image_side=None):
        self.rows = rows
        self.processor = processor
        self.tokenizer = getattr(processor, 'tokenizer', processor)
        self.max_length = max_length
        self.image_side = image_side

    def __len__(self):
        return len(self.rows)

    def _encode(self, text, image):
        if image is None:
            return self.tokenizer(text, return_tensors='pt', add_special_tokens=False)
        return self.processor(text=[text], images=[image], return_tensors='pt')

    def __getitem__(self, i):
        ex = self.rows[i]
        image = load_image(ex['image'], self.image_side) if ex.get('image') else None
        if image is not None:
            # The processor's template writes the image placeholder that the
            # processor then expands into vision tokens.
            prompt = self.processor.apply_chat_template(
                chat_messages(ex, image), tokenize=False, add_generation_prompt=True)
        else:
            prompt = self.tokenizer.apply_chat_template(
                chat_messages(ex), tokenize=False, add_generation_prompt=True, enable_thinking=False)

        prompt_len = self._encode(prompt, image)['input_ids'].shape[1]
        enc = self._encode(prompt + ex['assistant'] + END, image)
        input_ids = enc['input_ids'][0]
        if len(input_ids) > self.max_length:
            if image is not None:
                raise ValueError(f'{ex["image"]}: {len(input_ids)} tokens > max_length; lower --image-side')
            input_ids = input_ids[: self.max_length]
        labels = input_ids.clone()
        labels[:prompt_len] = IGNORE

        item = {k: v[0] if k in ('input_ids', 'attention_mask') else v for k, v in enc.items()}
        item['input_ids'] = input_ids
        item['attention_mask'] = item['attention_mask'][: len(input_ids)]
        item['labels'] = labels
        return item


def collate_one(features):
    """Batch size 1 (use gradient accumulation for bigger effective
    batches): image tensors differ in shape per example, so no padding."""
    assert len(features) == 1, 'use per_device_train_batch_size=1'
    f = dict(features[0])
    for k in ('input_ids', 'attention_mask', 'labels'):
        f[k] = f[k].unsqueeze(0)
    return f


def lora_model(model_cls, base, lora_rank, target_regex):
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from transformers import BitsAndBytesConfig

    bnb = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type='nf4',
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
    )
    model = model_cls.from_pretrained(base, quantization_config=bnb, torch_dtype=torch.bfloat16, device_map={'': 0})
    model = prepare_model_for_kbit_training(model, use_gradient_checkpointing=True,
                                            gradient_checkpointing_kwargs={'use_reentrant': False})
    config = LoraConfig(r=lora_rank, lora_alpha=lora_rank * 2, lora_dropout=0.05, bias='none',
                        target_modules=target_regex, task_type='CAUSAL_LM')
    model = get_peft_model(model, config)
    model.print_trainable_parameters()
    return model


def train(model, processor, train_set, val_set, out_dir, *, epochs, lr, grad_accum, seed):
    from transformers import Trainer, TrainingArguments

    args = TrainingArguments(
        output_dir=str(out_dir),
        num_train_epochs=epochs,
        per_device_train_batch_size=1,
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=grad_accum,
        learning_rate=lr,
        lr_scheduler_type='cosine',
        warmup_ratio=0.05,
        bf16=True,
        optim='paged_adamw_8bit',
        logging_steps=10,
        eval_strategy='steps' if val_set else 'no',
        eval_steps=100,
        save_strategy='steps',
        save_steps=100,
        save_total_limit=3,
        load_best_model_at_end=bool(val_set),
        metric_for_best_model='eval_loss',
        remove_unused_columns=False,
        dataloader_num_workers=0,  # Windows: worker processes re-import torch slowly
        report_to='none',
        seed=seed,
    )
    trainer = Trainer(model=model, args=args, train_dataset=train_set, eval_dataset=val_set or None,
                      data_collator=collate_one)
    trainer.train()
    final = Path(out_dir) / 'final'
    trainer.model.save_pretrained(final)
    processor.save_pretrained(final)
    print(f'LoRA adapter saved to {final}')
    return final
