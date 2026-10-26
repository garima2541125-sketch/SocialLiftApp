"""Step 1 for the Qwen-Image style LoRA: lays the dataset out the way
ai-toolkit (github.com/ostris/ai-toolkit) reads it, and writes its config.

    python -m training.image_lora.prepare --gpu 24gb

Writes:
    training/build/image_lora/general/   all non-JUET images + same-name .txt captions
    training/build/image_lora/juet/      the 15 JUET posts (repeated --juet-repeats times per epoch)
    training/build/image_lora/config.yaml
"""
import argparse
import shutil

import yaml

from ..common.config import BUILD, DEFAULT_EXCLUDED_SOURCES, IMAGE_BASE, JUET_TRIGGER, OUTPUT, SEED
from ..common.dataset import load_samples

OUT = BUILD / 'image_lora'

# How the 20B Qwen-Image transformer is squeezed into the GPU while training.
# 24 GB: 3-bit weights plus ai-toolkit's accuracy-recovery adapter (the file
#   below is the one for the original Qwen-Image; if ai-toolkit has published
#   one for 2512, use that — see config/examples/train_lora_qwen_image_24gb.yaml
#   in your ai-toolkit checkout).
# 48 GB+: 8-bit weights, simpler and slightly better.
GPU_PRESETS = {
    '24gb': dict(quantize=True, qtype='uint3|ostris/accuracy_recovery_adapters/qwen_image_torchao_uint3.safetensors',
                 quantize_te=True, qtype_te='qfloat8', low_vram=True),
    '48gb': dict(quantize=True, qtype='qfloat8', quantize_te=True, qtype_te='qfloat8', low_vram=False),
}

SAMPLE_PROMPTS = [
    f'{JUET_TRIGGER}, portrait social media post congratulating a student on a campus placement. Pale blue header '
    'band, white body with a large purple script heading "Congratulations", a circular photo of a smiling student in '
    'a navy blazer on the right in a lavender ring, purple and light blue waves at the bottom.',
    f'{JUET_TRIGGER}, square admissions social media post. Top half: photo of students in a modern lab; a royal blue '
    'banner with white bold text "Admissions Open 2027"; a dark blue dotted circle "APPLY NOW" bottom left; navy and '
    'peach diagonal stripe accents.',
    f'{JUET_TRIGGER}, square festival greeting post for Diwali. Warm cream background, glowing diyas and marigolds '
    'on the left, large maroon script "Happy Diwali" on the right, navy brush banner at the bottom.',
    'Bakery grand opening flyer. Layout: centered headline text "Grand Opening" over a photo of fresh bread. '
    'Color palette: cream, brown, orange. Style: warm and inviting, business social media post.',
]


def copy_set(samples, folder):
    folder.mkdir(parents=True, exist_ok=True)
    for s in samples:
        shutil.copy2(s.image_path, folder / s.file)
        (folder / f'{s.stem}.txt').write_text(s.caption + '\n', encoding='utf-8')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--gpu', choices=GPU_PRESETS, default='24gb', help='VRAM of the GPU you will train on')
    p.add_argument('--base', default=IMAGE_BASE)
    p.add_argument('--steps', type=int, default=3000)
    p.add_argument('--rank', type=int, default=32)
    p.add_argument('--lr', type=float, default=1e-4)
    p.add_argument('--juet-repeats', type=int, default=12,
                   help='15 JUET posts vs ~830 others: repeat them so the JUET style is actually learned')
    p.add_argument('--include-source', action='append', default=[],
                   help=f'also train on a source left out by default {DEFAULT_EXCLUDED_SOURCES}')
    p.add_argument('--name', default='sociallift_poster_style')
    a = p.parse_args()

    excluded = tuple(s for s in DEFAULT_EXCLUDED_SOURCES if s not in a.include_source)
    samples = load_samples(exclude_sources=excluded)
    juet = [s for s in samples if s.is_juet]
    general = [s for s in samples if not s.is_juet]

    if OUT.exists():
        shutil.rmtree(OUT)
    copy_set(general, OUT / 'general')
    copy_set(juet, OUT / 'juet')

    # Most dataset images are around 512-1000 px; JUET screenshots are 450-920 px,
    # so no 1024 bucket (it would only upscale them).
    dataset_common = dict(caption_ext='txt', caption_dropout_rate=0.0, cache_latents_to_disk=True,
                          resolution=[512, 768])
    config = {
        'job': 'extension',
        'config': {
            'name': a.name,
            'process': [{
                'type': 'diffusion_trainer',
                'training_folder': str(OUTPUT / 'image_lora'),
                'device': 'cuda:0',
                'network': {'type': 'lora', 'linear': a.rank, 'linear_alpha': a.rank},
                'save': {'dtype': 'bf16', 'save_every': 250, 'max_step_saves_to_keep': 6},
                'datasets': [
                    {'folder_path': str(OUT / 'general'), **dataset_common},
                    {'folder_path': str(OUT / 'juet'), 'num_repeats': a.juet_repeats, **dataset_common},
                ],
                'train': {
                    'batch_size': 1,
                    'steps': a.steps,
                    'gradient_accumulation': 1,
                    'train_unet': True,
                    'train_text_encoder': False,
                    # Captions are encoded once up front, so the text encoder
                    # doesn't have to sit in VRAM during training.
                    'cache_text_embeddings': True,
                    'gradient_checkpointing': True,
                    'noise_scheduler': 'flowmatch',
                    'timestep_type': 'weighted',
                    'optimizer': 'adamw8bit',
                    'lr': a.lr,
                    'dtype': 'bf16',
                    'seed': SEED,
                },
                'model': {'name_or_path': a.base, 'arch': 'qwen_image', **GPU_PRESETS[a.gpu]},
                'sample': {
                    'sampler': 'flowmatch',
                    'sample_every': 250,
                    'width': 768,
                    'height': 960,
                    'prompts': SAMPLE_PROMPTS,
                    'neg': '',
                    'seed': SEED,
                    'walk_seed': True,
                    'guidance_scale': 4,
                    'sample_steps': 25,
                },
            }],
        },
        'meta': {'name': a.name, 'version': '1.0'},
    }
    (OUT / 'config.yaml').write_text(yaml.safe_dump(config, sort_keys=False, allow_unicode=True), encoding='utf-8')

    print(f'{len(general)} general + {len(juet)} JUET images (x{a.juet_repeats}) -> {OUT}')
    print(f'config: {OUT / "config.yaml"}')


if __name__ == '__main__':
    main()
