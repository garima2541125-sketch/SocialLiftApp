"""QLoRA fine-tune of Qwen3-VL 4B on the design-notes data from build_data.py.

    python -m training.vision_lora.train

Fits an 8 GB GPU (RTX 5050 laptop) at the defaults: 4-bit base, images
shrunk to 640 px, batch 1 with gradient accumulation. JUET posts are
repeated in the training set so 15 examples aren't drowned out by 870.
"""
import argparse

from transformers import AutoProcessor, Qwen3VLForConditionalGeneration

from ..common.config import BUILD, OUTPUT, SEED, VISION_BASE
from ..common.sft import SFTDataset, lora_model, read_jsonl, train

DATA = BUILD / 'vision_lora'

# LoRA on the language model only: the vision encoder already sees posters
# well; what changes is how it describes them.
TARGETS = r'.*language_model.*\.(q_proj|k_proj|v_proj|o_proj|gate_proj|up_proj|down_proj)'


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--base', default=VISION_BASE)
    p.add_argument('--epochs', type=float, default=2)
    p.add_argument('--lr', type=float, default=1e-4)
    p.add_argument('--rank', type=int, default=16)
    p.add_argument('--grad-accum', type=int, default=8)
    p.add_argument('--image-side', type=int, default=640, help='longest image side in px (VRAM vs detail)')
    p.add_argument('--max-length', type=int, default=2048)
    p.add_argument('--juet-repeats', type=int, default=5)
    p.add_argument('--out', default=str(OUTPUT / 'vision_lora'))
    a = p.parse_args()

    train_rows = read_jsonl(DATA / 'train.jsonl')
    val_rows = read_jsonl(DATA / 'val.jsonl')
    juet = [r for r in train_rows if r.get('juet')]
    train_rows += juet * (a.juet_repeats - 1)

    processor = AutoProcessor.from_pretrained(a.base)
    model = lora_model(Qwen3VLForConditionalGeneration, a.base, a.rank, TARGETS)
    train(
        model, processor,
        SFTDataset(train_rows, processor, a.max_length, image_side=a.image_side),
        SFTDataset(val_rows, processor, a.max_length, image_side=a.image_side),
        a.out, epochs=a.epochs, lr=a.lr, grad_accum=a.grad_accum, seed=SEED,
    )


if __name__ == '__main__':
    main()
