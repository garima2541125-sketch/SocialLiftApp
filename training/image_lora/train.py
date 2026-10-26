"""Step 2 for the Qwen-Image style LoRA: runs ai-toolkit on the config that
prepare.py wrote.

    python -m training.image_lora.train --ai-toolkit C:\\path\\to\\ai-toolkit

ai-toolkit must be cloned and installed first (see training/README.md). Its
own Python environment is used, so this script only needs the standard library.
LoRA checkpoints and sample images land in training/output/image_lora/<name>/.
"""
import argparse
import os
import subprocess
import sys
from pathlib import Path

from ..common.config import BUILD

CONFIG = BUILD / 'image_lora' / 'config.yaml'


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--ai-toolkit', default=os.environ.get('AI_TOOLKIT'), help='folder of your ai-toolkit clone')
    p.add_argument('--python', help="ai-toolkit's python (default: its venv, else this one)")
    a = p.parse_args()

    if not a.ai_toolkit:
        sys.exit('Pass --ai-toolkit <folder> or set AI_TOOLKIT.')
    toolkit = Path(a.ai_toolkit)
    if not (toolkit / 'run.py').exists():
        sys.exit(f'{toolkit} is not an ai-toolkit clone (no run.py).')
    if not CONFIG.exists():
        sys.exit('No config yet: run  python -m training.image_lora.prepare  first.')

    python = a.python
    if not python:
        for venv_python in (toolkit / 'venv' / 'Scripts' / 'python.exe', toolkit / 'venv' / 'bin' / 'python'):
            if venv_python.exists():
                python = str(venv_python)
                break
    python = python or sys.executable

    print(f'{python} run.py {CONFIG}')
    sys.exit(subprocess.call([python, 'run.py', str(CONFIG)], cwd=toolkit))


if __name__ == '__main__':
    main()
