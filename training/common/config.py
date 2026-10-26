"""Paths, base models and shared settings for every training script."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DATASET = REPO / 'dataset'
IMAGES = DATASET / 'images'
METADATA = DATASET / 'metadata' / 'metadata.csv'

# Everything the scripts write goes here (git-ignored).
BUILD = REPO / 'training' / 'build'
OUTPUT = REPO / 'training' / 'output'

# The models Social Lift runs (see src/ai/localAi.js), as their Hugging Face
# originals: fine-tuning needs the full-precision weights, not the GGUF /
# Ollama copies the app uses at run time.
IMAGE_BASE = 'Qwen/Qwen-Image-2512'        # poster generation (ComfyUI)
VISION_BASE = 'Qwen/Qwen3-VL-4B-Instruct'  # design notes, image analysis (Ollama qwen3-vl:4b-instruct)
TEXT_BASE = 'Qwen/Qwen3-8B'                # planning, captions, prompts (Ollama qwen3:8b)

# Ollama names of the same models, used to copy their chat templates when the
# fine-tuned models are imported back into Ollama.
OLLAMA_VISION = 'qwen3-vl:4b-instruct'
OLLAMA_TEXT = 'qwen3:8b'

# Captions of the JUET posts start with this; prompts that start with it ask
# the image LoRA for JUET's own style.
JUET_TRIGGER = 'juet_style poster'

# pitt_ads images are real third-party brand adverts with an unclear licence
# (see dataset/dataset_report.md), so they are left out unless asked for.
DEFAULT_EXCLUDED_SOURCES = ('pitt_ads',)

SEED = 7
