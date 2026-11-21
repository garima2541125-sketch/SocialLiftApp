"""Downloads extra Crello designs (huggingface.co/datasets/cyberagent/crello)
for the Qwen-Image LoRA: post-shaped social media designs only, each saved as
a PNG with a same-name .txt caption, the way ai-toolkit reads a dataset.

    python -m training.image_lora.download_crello --count 10000

Writes:
    training/build/crello/images/crello_<id>.png + .txt
    training/build/crello/metadata.csv

Crello's 23,302 designs come as ~18 GB of parquet files. They are fetched one
at a time and deleted once their images are saved, so the disk only ever holds
one of them plus the PNGs.

To train on these too, point a second folder at training/build/crello/images
in training/build/image_lora/config.yaml (see training/README.md).
"""
import argparse
import csv
import io
import json
import re
import shutil

import pyarrow.parquet as pq
from huggingface_hub import hf_hub_download, list_repo_files
from PIL import Image

from ..common.config import BUILD

REPO_ID = 'cyberagent/crello'
REVISION = '5.1.0'
OUT = BUILD / 'crello'
SHARDS = BUILD / 'crello_shards'

# Social posts and poster-like designs. Covers, banners and non-social
# designs (resumes, menus, business cards...) are left out. Posts alone come
# to only ~28% of Crello, so stories, pins and thumbnails are in too to reach
# 10,000.
WANTED_FORMATS = {
    'Instagram', 'Instagram AD', 'Instagram Story', 'Facebook', 'Facebook AD', 'Twitter', 'Pinterest',
    'Tumblr', 'Youtube Thumbnail', 'Poster', 'Poster US', 'Flayer', 'Invitation', 'Postcard', 'Card',
    'Image', 'Graphic',
}
# Canvas width / height. Keeps 9:16 stories up to landscape posts (1.91:1)
# and drops the 3:1 Twitter headers that share the "Twitter" format.
MIN_ASPECT, MAX_ASPECT = 0.5, 1.95

FORMAT_WORDS = {
    'Instagram': 'Instagram post', 'Instagram AD': 'Instagram ad', 'Instagram Story': 'Instagram story',
    'Facebook': 'Facebook post', 'Facebook AD': 'Facebook ad', 'Twitter': 'Twitter post', 'Pinterest': 'Pinterest pin',
    'Tumblr': 'Tumblr post', 'Youtube Thumbnail': 'YouTube thumbnail', 'Poster': 'poster', 'Poster US': 'poster',
    'Flayer': 'flyer', 'Invitation': 'invitation', 'Postcard': 'postcard', 'Card': 'greeting card',
    'Image': 'social media graphic', 'Graphic': 'social media graphic',
}

COLUMNS = ['id', 'format', 'canvas_width', 'canvas_height', 'category', 'title', 'keywords', 'text', 'preview']


def label_names(parquet_file):
    """Class-label names (format, category) stored in the parquet's Hugging Face metadata."""
    info = json.loads(parquet_file.schema_arrow.metadata[b'huggingface'])['info']['features']
    return info['format']['names'], info['category']['names']


def caption_for(row, fmt, category):
    """One caption in the style of dataset/images/*.txt: what it is, then its words."""
    kind = FORMAT_WORDS.get(fmt, fmt.lower())
    title = (row['title'] or '').strip().rstrip('.')
    parts = [f'{title}. {kind}' if title else kind]
    if category:
        # 'socialActivityCharity' -> 'social activity charity'
        parts[0] += ', ' + re.sub(r'(?<!^)(?=[A-Z])', ' ', category).replace('_', ' ').lower() + ' design'
    lines = [t.strip().replace('\n', ' ') for t in row['text'] or [] if t and t.strip()]
    if lines:
        parts.append('Text: ' + '; '.join(f'"{t}"' for t in lines[:6]))
    keywords = [k for k in row['keywords'] or [] if k and k.lower() not in {'instagram', 'ig', 'insta', 'facebook', 'fb', 'twitter'}]
    if keywords:
        parts.append('Keywords: ' + ', '.join(keywords[:10]))
    return '. '.join(parts) + '.'


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--count', type=int, default=10000, help='how many images to keep')
    args = p.parse_args()

    images = OUT / 'images'
    images.mkdir(parents=True, exist_ok=True)
    seen = {f.stem for f in images.glob('*.png')}
    print(f'{len(seen)} already downloaded')

    files = sorted(f for f in list_repo_files(REPO_ID, repo_type='dataset', revision=REVISION) if f.endswith('.parquet'))
    # train first, then validation and test if train runs short
    files.sort(key=lambda f: ('train' not in f, 'validation' not in f, f))

    # Parquet files already fully read, so a resumed run doesn't fetch them again.
    done_path = OUT / 'done_files.txt'
    done = set(done_path.read_text().split()) if done_path.exists() else set()

    meta_path = OUT / 'metadata.csv'
    new_meta = not meta_path.exists()
    with open(meta_path, 'a', newline='', encoding='utf-8') as meta:
        writer = csv.writer(meta)
        if new_meta:
            writer.writerow(['filename', 'format', 'category', 'canvas_width', 'canvas_height', 'title'])

        for name in files:
            if len(seen) >= args.count:
                break
            if name in done:
                continue
            path = hf_hub_download(REPO_ID, name, repo_type='dataset', revision=REVISION, local_dir=SHARDS)
            pf = pq.ParquetFile(path)
            formats, categories = label_names(pf)
            kept = 0
            for batch in pf.iter_batches(batch_size=64, columns=COLUMNS):
                for row in batch.to_pylist():
                    if len(seen) >= args.count:
                        break
                    fmt = formats[row['format']]
                    aspect = row['canvas_width'] / row['canvas_height']
                    stem = f'crello_{row["id"]}'
                    if fmt not in WANTED_FORMATS or not MIN_ASPECT <= aspect <= MAX_ASPECT:
                        continue
                    category = categories[row['category']]
                    if stem in seen:
                        # from an earlier run: refresh the caption, keep the image
                        (images / f'{stem}.txt').write_text(caption_for(row, fmt, category) + '\n', encoding='utf-8')
                        continue
                    preview = (row['preview'] or {}).get('bytes')
                    if not preview:
                        continue
                    Image.open(io.BytesIO(preview)).convert('RGB').save(images / f'{stem}.png')
                    (images / f'{stem}.txt').write_text(caption_for(row, fmt, category) + '\n', encoding='utf-8')
                    writer.writerow([f'{stem}.png', fmt, category, row['canvas_width'], row['canvas_height'], row['title']])
                    seen.add(stem)
                    kept += 1
            meta.flush()
            if len(seen) < args.count:
                with open(done_path, 'a') as f:
                    f.write(name + '\n')
            print(f'{name}: kept {kept}, total {len(seen)}/{args.count}', flush=True)
            del pf
            shutil.rmtree(SHARDS, ignore_errors=True)

    print(f'Done: {len(seen)} images in {images}')
    if len(seen) < args.count:
        print(f'Crello only has {len(seen)} designs matching these formats.')


if __name__ == '__main__':
    main()
