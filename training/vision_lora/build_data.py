"""Builds training data for the vision model (Qwen3-VL 4B): image -> the
design-notes JSON that Brand Kit asks for (describeReferenceStyle in
src/ai/localAi.js).

    python -m training.vision_lora.build_data            # needs Ollama running (teacher, see below)
    python -m training.vision_lora.build_data --no-teacher

Where each field of the target comes from:
    category     the dataset subtype ("Placement congratulations", ...); hand-written for JUET posts
    style        the dataset caption, minus the words written on the poster
    palette      the dataset's measured dominant colours
    headingStyle, photoStyle, photoSide
                 hand-written for the 15 JUET posts. The other images don't
                 have them, so by default the base model (through Ollama) is
                 asked once per image and its answers are used: the
                 "teacher". Answers are cached in training/build/vision_lora/teacher.json,
                 so a stopped run picks up where it left off. With --no-teacher
                 those three fields are left out for non-JUET images. The
                 model then learns to skip them sometimes, and the app falls
                 back to its defaults.
"""
import argparse
import base64
import json
import urllib.request

from ..common.config import BUILD, OLLAMA_VISION, SEED
from ..common.dataset import design_only, load_samples, split
from ..common.juet_notes import JUET_NOTES
from ..common.sft import write_jsonl

OUT = BUILD / 'vision_lora'
PHOTO_STYLES = ('circle', 'cutout', 'rect', 'none')
SIDES = ('left', 'right', 'center')

# Kept word-for-word in sync with describeReferenceStyle in src/ai/localAi.js:
# the fine-tuned model must be trained on the prompt it will be given.
SYSTEM = (
    'You study a social media post design so NEW posts can be drawn from scratch in exactly the same visual style. '
    'Reply with JSON only, shaped as {"category": string, "style": string, "headingStyle": string, "palette": [string], '
    '"photoStyle": string, "photoSide": string}. '
    '"category" is a short name for this kind of post, e.g. "Placement congratulations". '
    '"style" is a detailed paragraph an image generator can follow to draw a new design in the same style: '
    'background colours and gradients, decorative shapes '
    '(waves, ribbons, gold curves, frames) and where they sit, '
    'how text is arranged (centred, left-aligned, in pills or banners), spacing and overall feel. '
    'Describe the design only — do not mention any names, words, numbers, logos or contact details shown on '
    'it, and do not describe its header or footer (the app adds those itself). '
    '"headingStyle" describes the main heading lettering, e.g. "large purple brush-script" or "bold navy serif". '
    '"palette" is the 3-6 main colours as hex codes. '
    '"photoStyle" is how the main photo of a person is shown: "circle" (in a round frame), "cutout" (person cut out '
    'and placed straight on the design), "rect" (in a rectangular frame) or "none". '
    '"photoSide" is where that photo sits: "left", "right" or "center".'
)
USER = 'Write design notes for this post.'


def ask_teacher(url, model, image_path):
    body = {
        'model': model,
        'stream': False,
        'format': 'json',
        'options': {'temperature': 0, 'seed': SEED},
        'messages': [
            {'role': 'system', 'content': SYSTEM},
            {'role': 'user', 'content': USER, 'images': [base64.b64encode(image_path.read_bytes()).decode()]},
        ],
    }
    req = urllib.request.Request(f'{url}/api/chat', data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=600) as r:
        reply = json.loads(json.loads(r.read())['message']['content'])
    return {
        'headingStyle': str(reply.get('headingStyle', '')).strip(),
        'photoStyle': reply.get('photoStyle') if reply.get('photoStyle') in PHOTO_STYLES else 'none',
        'photoSide': reply.get('photoSide') if reply.get('photoSide') in SIDES else 'center',
    }


def target(sample, teacher):
    notes = {'category': sample.label, 'style': design_only(sample.caption)}
    extra = JUET_NOTES.get(sample.stem) or teacher.get(sample.stem)
    if sample.stem in JUET_NOTES:
        notes['category'] = extra['category']
    if extra and extra.get('headingStyle'):
        notes['headingStyle'] = extra['headingStyle']
    notes['palette'] = sample.palette
    if extra:
        notes['photoStyle'] = extra['photoStyle']
        notes['photoSide'] = extra['photoSide']
    return json.dumps(notes, ensure_ascii=False)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--no-teacher', action='store_true')
    p.add_argument('--ollama', default='http://127.0.0.1:11434')
    p.add_argument('--teacher-model', default=OLLAMA_VISION)
    a = p.parse_args()

    samples = load_samples()
    cache_file = OUT / 'teacher.json'
    teacher = json.loads(cache_file.read_text(encoding='utf-8')) if cache_file.exists() else {}

    if not a.no_teacher:
        todo = [s for s in samples if s.stem not in JUET_NOTES and s.stem not in teacher]
        print(f'asking {a.teacher_model} about {len(todo)} images (cached: {len(teacher)})')
        OUT.mkdir(parents=True, exist_ok=True)
        for i, s in enumerate(todo, 1):
            try:
                teacher[s.stem] = ask_teacher(a.ollama, a.teacher_model, s.image_path)
            except Exception as e:  # one bad reply shouldn't stop a 900-image run
                print(f'  {s.file}: {e}')
                continue
            if i % 20 == 0 or i == len(todo):
                cache_file.write_text(json.dumps(teacher, indent=1), encoding='utf-8')
                print(f'  {i}/{len(todo)}')

    train, val = split(samples)
    for name, part in (('train', train), ('val', val)):
        rows = [{'system': SYSTEM, 'user': USER, 'assistant': target(s, {} if a.no_teacher else teacher),
                 'image': str(s.image_path), 'juet': s.is_juet} for s in part]
        write_jsonl(OUT / f'{name}.jsonl', rows)
        print(f'{name}: {len(rows)} examples -> {OUT / f"{name}.jsonl"}')


if __name__ == '__main__':
    main()
