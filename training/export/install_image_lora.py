"""Copies a trained Qwen-Image style LoRA into ComfyUI's loras folder.

    python -m training.export.install_image_lora --comfyui C:\\Users\\gaurm\\ComfyUI
    python -m training.export.install_image_lora --comfyui ... --checkpoint path\\to\\step_002000.safetensors

By default it takes the newest checkpoint ai-toolkit saved. Look at the
sample images in training/output/image_lora/<name>/samples/ first: a
checkpoint from before the samples start copying the training images
too closely is usually the best one.

In ComfyUI the LoRA goes in a second LoraLoaderModelOnly node, chained after
the Lightning LoRA (see buildImageWorkflow in src/ai/localAi.js).
"""
import argparse
import shutil
import sys
from pathlib import Path

from ..common.config import OUTPUT


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--comfyui', required=True, help='ComfyUI folder')
    p.add_argument('--checkpoint', help='a specific .safetensors (default: newest one)')
    p.add_argument('--as', dest='name', default='sociallift_style.safetensors')
    a = p.parse_args()

    if a.checkpoint:
        src = Path(a.checkpoint)
    else:
        found = sorted((OUTPUT / 'image_lora').rglob('*.safetensors'), key=lambda f: f.stat().st_mtime)
        if not found:
            sys.exit(f'No LoRA checkpoints under {OUTPUT / "image_lora"} yet.')
        src = found[-1]

    dest = Path(a.comfyui) / 'models' / 'loras' / a.name
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    print(f'{src}\n  -> {dest}')


if __name__ == '__main__':
    main()
