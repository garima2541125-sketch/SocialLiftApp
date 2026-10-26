"""Reads dataset/metadata/metadata.csv and the per-image caption files."""
import csv
import random
import re
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

from .config import DEFAULT_EXCLUDED_SOURCES, IMAGES, JUET_TRIGGER, METADATA, SEED

# A readable name for each subtype: what the app calls a post's "category".
SUBTYPE_LABELS = {
    'placement_post': 'Placement congratulations',
    'admission_announcement': 'Admissions open',
    'achievement_post': 'Achievement announcement',
    'event_poster': 'Event announcement',
    'university_general_post': 'University post',
    'sale_post': 'Sale',
    'offer_promo': 'Offer / promotion',
    'business_general_post': 'Business post',
    'brand_announcement': 'Brand announcement',
    'product_launch': 'Product launch',
    'csr_post': 'Social cause / CSR',
    'corporate_announcement': 'Corporate announcement',
    'organization_general_post': 'Organisation post',
    'award_post': 'Award announcement',
}


@dataclass
class Sample:
    file: str
    image_path: Path
    caption: str
    category: str
    subtype: str
    palette: list = field(default_factory=list)
    aspect: str = 'other'
    source: str = ''
    has_logo: bool = False
    has_cta_button: bool = False

    @property
    def stem(self):
        return Path(self.file).stem

    @property
    def is_juet(self):
        return self.source == 'juet'

    @property
    def label(self):
        return SUBTYPE_LABELS.get(self.subtype, self.subtype.replace('_', ' ').capitalize())


def _bool(value):
    return str(value).strip().lower() == 'true'


def load_samples(exclude_sources=DEFAULT_EXCLUDED_SOURCES):
    """Every image that has a caption, minus the excluded sources."""
    samples = []
    with open(METADATA, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            if row['source_dataset'] in exclude_sources:
                continue
            image = IMAGES / row['filename']
            caption_file = image.with_suffix('.txt')
            if not image.exists() or not caption_file.exists():
                print(f'skipping {row["filename"]}: image or caption missing')
                continue
            samples.append(Sample(
                file=row['filename'],
                image_path=image,
                caption=caption_file.read_text(encoding='utf-8').strip(),
                category=row['category'],
                subtype=row['subtype'],
                palette=[c for c in row['dominant_colors'].split(';') if c],
                aspect=row['aspect_ratio'],
                source=row['source_dataset'],
                has_logo=_bool(row['has_logo']),
                has_cta_button=_bool(row['has_cta_button']),
            ))
    return samples


def split(samples, val_fraction=0.05, seed=SEED):
    """Train / validation split, stratified by subtype. JUET posts always go to
    training: there are only 15 of them."""
    by_subtype = defaultdict(list)
    for s in samples:
        if not s.is_juet:
            by_subtype[s.subtype].append(s)
    rng = random.Random(seed)
    train, val = [s for s in samples if s.is_juet], []
    for group in by_subtype.values():
        rng.shuffle(group)
        n_val = max(1, round(len(group) * val_fraction)) if len(group) >= 10 else 0
        val += group[:n_val]
        train += group[n_val:]
    rng.shuffle(train)
    return train, val


_QUOTED = re.compile(r'["“][^"”]*["”]')
_SAYING = re.compile(r'\b(with )?(text|words?)( overlay)? (saying|reading|that says)\b[^.]*', re.I)


def design_only(caption):
    """The caption without the words written on the poster, the trigger phrase
    or names, for the vision model's "style" notes (the app asks it for the
    design only, see describeReferenceStyle in src/ai/localAi.js)."""
    text = caption.replace(JUET_TRIGGER + ',', '').replace(JUET_TRIGGER, '')
    text = _QUOTED.sub('', text)
    text = _SAYING.sub('', text)
    text = re.sub(r'\s+([,.;:])', r'\1', text)
    text = re.sub(r'([,;:])\1+', r'\1', text)
    return re.sub(r'\s{2,}', ' ', text).strip(' ,')


def first_sentence(caption):
    text = caption.replace(JUET_TRIGGER + ',', '').strip()
    return re.split(r'(?<=[.!?])\s', text, maxsplit=1)[0].strip()
