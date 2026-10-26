"""QLoRA fine-tune of Qwen3 8B on the brief -> image prompt data from
build_data.py.

    python -m training.text_lora.train

Fits an 8 GB GPU at the defaults (4-bit base, 1024-token examples, batch 1
with gradient accumulation), but only just: close other GPU programs
(ComfyUI, Ollama) first.
"""
import argparse

from transformers import AutoModelForCausalLM, AutoTokenizer

from ..common.config import BUILD, OUTPUT, SEED, TEXT_BASE
from ..common.sft import SFTDataset, lora_model, read_jsonl, train

DATA = BUILD / 'text_lora'
TARGETS = ['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj']


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--base', default=TEXT_BASE)
    p.add_argument('--epochs', type=float, default=2)
    p.add_argument('--lr', type=float, default=1e-4)
    p.add_argument('--rank', type=int, default=16)
    p.add_argument('--grad-accum', type=int, default=8)
    p.add_argument('--max-length', type=int, default=1024)
    p.add_argument('--juet-repeats', type=int, default=5)
    p.add_argument('--out', default=str(OUTPUT / 'text_lora'))
    a = p.parse_args()

    train_rows = read_jsonl(DATA / 'train.jsonl')
    val_rows = read_jsonl(DATA / 'val.jsonl')
    train_rows += [r for r in train_rows if r.get('juet')] * (a.juet_repeats - 1)

    tokenizer = AutoTokenizer.from_pretrained(a.base)
    model = lora_model(AutoModelForCausalLM, a.base, a.rank, TARGETS)
    train(
        model, tokenizer,
        SFTDataset(train_rows, tokenizer, a.max_length),
        SFTDataset(val_rows, tokenizer, a.max_length),
        a.out, epochs=a.epochs, lr=a.lr, grad_accum=a.grad_accum, seed=SEED,
    )


if __name__ == '__main__':
    main()
