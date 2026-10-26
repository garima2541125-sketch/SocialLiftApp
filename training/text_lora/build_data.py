"""Builds training data for the text model (Qwen3 8B): a short post brief ->
an image prompt written the way the image LoRA was trained (the dataset's
captions). This teaches Qwen3 to speak the image model's language: layout,
colours and style in that order, quoted on-poster text, and the JUET trigger
phrase for JUET-style posts.

    python -m training.text_lora.build_data

The dataset has no real user prompts, so each brief is made from the
image's own metadata: post type, what it shows (the caption's first
sentence), its colours in words and its shape.
"""
import colorsys

from ..common.config import BUILD
from ..common.dataset import first_sentence, load_samples, split
from ..common.sft import write_jsonl

OUT = BUILD / 'text_lora'

SYSTEM = (
    'You write prompts for an image model that draws finished social media post graphics. Given a brief, reply '
    'with one paragraph describing the post: what it shows, the layout, the exact text to write on it in double '
    'quotes, the colour palette in words and the style. If the brief asks for the JUET design style, start the '
    'paragraph with "juet_style poster,". Never invent names, numbers, dates or contact details that are not in '
    'the brief.'
)

SHAPES = {'1:1': 'square', '4:5': 'portrait (4:5)', '9:16': 'tall story (9:16)'}


def colour_name(hex_colour):
    """Same buckets as colourName in src/ai/designedPost.js."""
    r, g, b = (int(hex_colour[i:i + 2], 16) / 255 for i in (1, 3, 5))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if s < 0.15:
        return 'white' if l > 0.85 else 'near-black' if l < 0.2 else 'grey'
    h *= 360
    hue = ('red' if h < 15 or h >= 345 else 'orange' if h < 40 else 'gold' if h < 60 else 'green' if h < 160
           else 'teal' if h < 200 else 'blue' if h < 250 else 'purple' if h < 290 else 'pink')
    if hue == 'purple' and l > 0.6:
        return 'lavender'
    return ('deep ' if l < 0.3 else 'light ' if l > 0.72 else '') + hue


def brief(sample):
    colours = ', '.join(dict.fromkeys(colour_name(c) for c in sample.palette))
    who = (' for JUET (Jaypee University of Engineering & Technology, Guna), in the JUET design style'
           if sample.is_juet else f' for a {sample.category}')
    lines = [
        f'Post type: {sample.label}{who}.',
        f'Shows: {first_sentence(sample.caption)}',
        f'Colours: {colours}.' if colours else '',
        f'Shape: {SHAPES[sample.aspect]}.' if sample.aspect in SHAPES else '',
    ]
    return '\n'.join(l for l in lines if l)


def main():
    train, val = split(load_samples())
    for name, part in (('train', train), ('val', val)):
        rows = [{'system': SYSTEM, 'user': brief(s), 'assistant': s.caption, 'image': None, 'juet': s.is_juet}
                for s in part]
        write_jsonl(OUT / f'{name}.jsonl', rows)
        print(f'{name}: {len(rows)} examples -> {OUT / f"{name}.jsonl"}')


if __name__ == '__main__':
    main()
