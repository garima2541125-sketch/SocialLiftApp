# Dataset Report (full run)

> **Update — JUET images added.** `image_0903`–`image_0917` are 15 real JUET posts
> (screenshots of the university's own social media posts), hand-captioned. Their
> captions start with the trigger phrase `juet_style poster` and quote the exact text on
> each poster. `source_dataset` is `juet`, all in the `university` category:
> placement_post 4, admission_announcement 2, achievement_post 2, event_poster 2,
> university_general_post 5 (festival, national-day and notice posts). Their
> `has_*` flags and `dominant_colors` were set by hand, and `quality_score` is 1.0
> (not scored). Total is now **917**. Images 0906, 0907, 0908, 0910 and 0912 show real
> students' faces and names. They are for private training only: don't publish them or a
> model trained on them.

Total images: **902** (target was 325 per category x 3 categories = 975).

## Counts per category

- **university**: 313/325
- **business**: 325/325
- **organization**: 264/325

## Counts per source dataset

- `crello`: 834
- `pitt_ads`: 68

## Subtype breakdown

- **business**: sale_post=141, offer_promo=20, business_general_post=146, brand_announcement=11, product_launch=7
- **organization**: csr_post=110, corporate_announcement=65, organization_general_post=84, award_post=5
- **university**: placement_post=117, university_general_post=146, event_poster=28, admission_announcement=3, achievement_post=19

## Source datasets: requested vs. actually used

| Source | Role | License | Notes |
|---|---|---|---|
| `cyberagent/crello` | primary | CDLA-permissive-2.0 |  |
| `creative-graphic-design/PittImageVideoAdsDataset` | supplementary | unknown (derived from the academic Pitt Ads Dataset; flagged in report) |  |
| `PosterCraft/Poster100K` | supplementary | CC BY-NC-SA 4.0 (non-commercial) |  |
| `PosterCraft/Text-Render-2M` | excluded | Apache-2.0 | Gated (requires HF login + accepting terms), 950GB, and content is raw text-rendered-on-background pairs rather than composed social posts. User chose to skip during planning. |
| `Tony1109/crello-image-library` | excluded | ? | Contains cropped design ELEMENTS (icons/backgrounds/photos) for retrieval augmentation, not composed post images. Not usable as a final training image. |

## Quality score distribution

- mean: 0.5966, min: 0.4421, max: 0.6954, stdev: 0.0405
- selection threshold used: quality_score >= 0.35

## Shortfalls / manual review flags

- **university** is under target: got 313/325 (only 313 candidates cleared the quality bar in this category). Not padded with off-topic images per the project's filtering policy.
- **organization** is under target: got 264/325 (only 264 candidates cleared the quality bar in this category). Not padded with off-topic images per the project's filtering policy.
- 0 candidates were rejected for scoring below the quality threshold.
- 1441 candidates had no confident category match (neither source metadata keywords nor a confident CLIP guess) and were excluded rather than forced into a bucket.

## Possible third-party brand logos (flagged, not silently excluded)

- **All 1755 `pitt_ads` candidates are flagged.** This source is a corpus of real-world advertisements — every image depicts or names an actual product/brand, not just the ~20 well-known names our keyword scan checks for. Treat any image selected from `pitt_ads` as containing an unremovable third-party brand and review individually before any use beyond private experimentation.
Additional candidates matched a known brand-name keyword in their source metadata (review before using in a fine-tune whose outputs could be redistributed):

- `crello` row 41: apple
- `crello` row 114: apple
- `crello` row 415: apple
- `crello` row 733: apple
- `crello` row 1294: apple
- `crello` row 1953: apple
- `crello` row 2068: apple
- `crello` row 2306: apple
- `crello` row 2508: apple
- `crello` row 2978: apple
- `crello` row 3217: apple
- `crello` row 3278: apple
- `crello` row 4048: apple
- `crello` row 4194: apple
- `crello` row 4403: apple
- `crello` row 4708: apple
- `poster100k` row 1: apple
- `poster100k` row 6: disney
- `poster100k` row 68: apple
- `poster100k` row 69: apple
- `poster100k` row 70: netflix
- `poster100k` row 189: disney
- `poster100k` row 219: netflix
- `poster100k` row 221: netflix
- `poster100k` row 236: netflix
- `poster100k` row 239: disney
- `poster100k` row 245: apple, disney
- `poster100k` row 246: netflix
- `poster100k` row 269: disney
- `poster100k` row 318: amazon
- `poster100k` row 331: netflix
- `poster100k` row 348: disney
- `poster100k` row 375: netflix
- `poster100k` row 390: apple
- `poster100k` row 396: disney
- `poster100k` row 397: disney
- `poster100k` row 422: netflix
- `poster100k` row 450: apple
- `poster100k` row 472: netflix
- `poster100k` row 528: disney
- `poster100k` row 553: apple
- `poster100k` row 569: netflix
- `poster100k` row 626: disney
- `poster100k` row 639: apple
- `poster100k` row 646: apple
- `poster100k` row 661: netflix
- `poster100k` row 666: apple
- `poster100k` row 672: apple
- `poster100k` row 694: disney
- `poster100k` row 793: disney
- ... and 7 more (see state/full/brand_flags.json)

## Known limitations

- `has_logo` / `has_cta_button` / `has_text_headline` in metadata.csv are pixel-heuristic estimates (edge-density/saturation based), not a trained detector's output — spot-check before trusting them at face value.
- No source dataset contains dedicated university placement/admission content; the university category was filled via keyword/CLIP matching against general poster/ad/design datasets and may skew toward generic "event poster" style rather than true placement posts.
- `PosterCraft/Poster100K` content is movie/TV posters (CC BY-NC-SA 4.0, non-commercial) — any images drawn from it are style-adjacent, not category-authentic, and are non-commercially licensed.
- `creative-graphic-design/PittImageVideoAdsDataset` has an unlisted/"unknown" license on its Hugging Face card and derives from an academic ads research dataset; treat any images from it as research-use only until a clearer license is confirmed. Every image from this source also depicts a real third-party brand's advertisement (see brand-flag section above) — this is inherent to the source, not a filtering gap.
- `PosterCraft/Text-Render-2M` was excluded entirely (gated access, 950GB, and its content is closer to OCR training pairs than composed social posts).
- `Tony1109/crello-image-library` was excluded entirely (cropped design elements, not composed post images).
