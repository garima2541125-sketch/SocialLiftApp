"""Merges a trained LoRA adapter into its base model and imports the result
into Ollama, so the app can use it by name.

    python -m training.export.to_ollama --kind vision --name sociallift-vl
    python -m training.export.to_ollama --kind text   --name sociallift-qwen3 --llama-cpp C:\\path\\to\\llama.cpp

Then point the app at it in .env:
    EXPO_PUBLIC_VISION_MODEL=sociallift-vl
    EXPO_PUBLIC_CAPTION_MODEL=sociallift-qwen3

Merging loads the base model in bf16 on the CPU: about 9 GB of RAM for the 4B
vision model and 17 GB for the 8B text model (close other programs, or run
this step on a machine with more RAM).

Text model: converted to GGUF with llama.cpp, then imported.
Vision model: Ollama imports the merged safetensors folder directly. If
your Ollama version says the architecture isn't supported for import,
update Ollama, or keep the base vision model in the app.
"""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

import torch

from ..common.config import OLLAMA_TEXT, OLLAMA_VISION, OUTPUT, TEXT_BASE, VISION_BASE

KINDS = {
    'vision': dict(base=VISION_BASE, ollama_base=OLLAMA_VISION, adapter=OUTPUT / 'vision_lora' / 'final'),
    'text': dict(base=TEXT_BASE, ollama_base=OLLAMA_TEXT, adapter=OUTPUT / 'text_lora' / 'final'),
}


def merge(kind, base, adapter, out):
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoProcessor, AutoTokenizer

    if kind == 'vision':
        from transformers import Qwen3VLForConditionalGeneration as model_cls
        processor = AutoProcessor.from_pretrained(adapter)
    else:
        model_cls = AutoModelForCausalLM
        processor = AutoTokenizer.from_pretrained(adapter)
    model = model_cls.from_pretrained(base, torch_dtype=torch.bfloat16, device_map={'': 'cpu'})
    model = PeftModel.from_pretrained(model, adapter).merge_and_unload()
    model.save_pretrained(out, safe_serialization=True, max_shard_size='4GB')
    processor.save_pretrained(out)
    print(f'merged model -> {out}')


def modelfile(ollama_base, source):
    """The base model's Modelfile (its chat template and parameters, which
    the app's prompts rely on) with FROM pointed at the new weights."""
    shown = subprocess.run(['ollama', 'show', ollama_base, '--modelfile'], capture_output=True, text=True,
                           encoding='utf-8', check=True).stdout
    lines = [l for l in shown.splitlines() if not l.startswith('FROM ') and not l.startswith('#')]
    return f'FROM {source}\n' + '\n'.join(lines) + '\n'


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--kind', choices=KINDS, required=True)
    p.add_argument('--name', required=True, help='name for the new Ollama model')
    p.add_argument('--adapter', help='LoRA folder (default: training/output/<kind>_lora/final)')
    p.add_argument('--llama-cpp', help='llama.cpp clone (text model only), for convert_hf_to_gguf.py')
    p.add_argument('--quantize', default='q4_K_M', help='Ollama quantisation, as the stock models use')
    a = p.parse_args()

    k = KINDS[a.kind]
    adapter = Path(a.adapter) if a.adapter else k['adapter']
    work = OUTPUT / 'export' / a.name
    merged = work / 'merged'
    if merged.exists():
        shutil.rmtree(merged)
    merge(a.kind, k['base'], adapter, merged)

    if a.kind == 'text':
        if not a.llama_cpp:
            sys.exit('--llama-cpp is needed to convert the text model to GGUF.')
        gguf = work / f'{a.name}-f16.gguf'
        subprocess.run([sys.executable, str(Path(a.llama_cpp) / 'convert_hf_to_gguf.py'), str(merged),
                        '--outfile', str(gguf), '--outtype', 'f16'], check=True)
        source = gguf
    else:
        source = merged

    mf = work / 'Modelfile'
    mf.write_text(modelfile(k['ollama_base'], source.resolve()), encoding='utf-8')
    subprocess.run(['ollama', 'create', a.name, '-f', str(mf), '--quantize', a.quantize], check=True)
    print(f'\nOllama model "{a.name}" is ready. Try:  ollama run {a.name}')


if __name__ == '__main__':
    main()
