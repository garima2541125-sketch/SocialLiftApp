import { describeReferenceStyle, generateImage, locateTextAndPhotos, readImageText, segmentImage } from './localAi';
import { cropFace } from '../utils/cropImage';
import { loadImage, maskCoverage, cutOut, drawInBox, drawRing, stampLogo, writeFooter, writeHeader } from '../utils/composite';

// Draws a post entirely FROM SCRATCH in the style of one of the account's
// reference posts. The reference image is only ever studied (its design
// notes) — no part of it is reused or written on:
//   - Qwen-Image draws the whole poster from the design notes: an empty
//     header bar, the body with this post's text, and an empty footer bar;
//   - the real logo and badges (which an image model can't draw exactly)
//     are stamped on the header bar, and the organisation name and contact
//     details (which must never be misspelt) are written on the header and
//     footer bars from Brand Kit;
//   - a person's photo goes over the empty frame Qwen-Image drew for it, or
//     the largest spot clear of text (Qwen3-VL finds the text), the way the
//     reference shows people: in a ring (circle), cut out by SAM 3 and
//     standing on the design (cutout), or in a frame (rect);
//   - Qwen3-VL reads the heading and name back; Qwen-Image tries again once
//     if either is misspelt or there's no room for the photo.

const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const round16 = (n) => Math.max(16, Math.round(n / 16) * 16);

// The design notes, written when the reference was saved (or now, for
// references saved before design notes existed).
export async function ensureStyleInfo(reference) {
  if (reference.styleInfo?.style) return reference.styleInfo;
  return describeReferenceStyle(reference.imageUri);
}

// Layout zones, as 0-1 of the poster: header, footer, logo and badge spots.
const HEADER_H = 0.14;
const FOOTER_H = 0.1;
const LOGO_BOX = { x: 0.035, y: 0.015, w: 0.15, h: HEADER_H - 0.03 };
const BADGES_BOX = { x: 0.71, y: 0.025, w: 0.26, h: HEADER_H - 0.05 };
// Organisation name, between the logo and the badges.
const NAME_BOX = { x: 0.21, y: 0.015, w: 0.48, h: HEADER_H - 0.03 };

// The darkest palette colour, for the organisation name.
const luminance = (hex) =>
  [1, 3, 5].reduce((sum, i, k) => sum + parseInt(hex.slice(i, i + 2), 16) * [0.3, 0.59, 0.11][k], 0);
const darkest = (palette = []) => [...palette].sort((a, b) => luminance(a) - luminance(b))[0];

// Where the photo goes in the body (0-1 of the poster), by side.
const PHOTO_AREA = {
  right: { x: 0.53, y: HEADER_H + 0.12, w: 0.44, h: 1 - HEADER_H - FOOTER_H - 0.14 },
  left: { x: 0.03, y: HEADER_H + 0.12, w: 0.44, h: 1 - HEADER_H - FOOTER_H - 0.14 },
  center: { x: 0.22, y: 0.5, w: 0.56, h: 1 - 0.5 - FOOTER_H - 0.02 },
};
const FREE_AREA_WORDS = {
  right: 'right half of the area between the bars',
  left: 'left half of the area between the bars',
  center: 'lower middle of the area between the bars',
};
// What Qwen-Image draws where the photo will go: an empty frame gives the
// text something to keep clear of, and the real photo is then laid exactly
// over it (see choosePhotoSpot).
const PHOTO_FRAME_WORDS = {
  circle: 'one large empty round photo frame (a thin ring, plain inside)',
  rect: 'one large empty rectangular photo frame (a thin border, plain inside)',
  cutout: 'a large empty plain area',
};

// A colour in words. Image models tend to print hex codes and numbers they
// are given as text on the image, so the prompt only ever uses words.
function colourName(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  if (sat < 0.15) return l > 0.85 ? 'white' : l < 0.2 ? 'near-black' : 'grey';
  let h;
  if (max === r) h = ((g - b) / (max - min)) % 6;
  else if (max === g) h = (b - r) / (max - min) + 2;
  else h = (r - g) / (max - min) + 4;
  h = (h * 60 + 360) % 360;
  const hue =
    h < 15 || h >= 345 ? 'red'
      : h < 40 ? 'orange'
        : h < 60 ? 'gold'
          : h < 160 ? 'green'
            : h < 200 ? 'teal'
              : h < 250 ? 'blue'
                : h < 290 ? 'purple'
                  : 'pink';
  if (hue === 'purple' && l > 0.6) return 'lavender';
  const shade = l < 0.3 ? 'deep ' : l > 0.72 ? 'light ' : '';
  return `${shade}${hue}`;
}

// The design notes without anything about logos, contact details, headers
// or footers: those are added exactly by the app, and if the notes mention
// them Qwen-Image draws its own (misspelt) versions.
const NOT_FOR_THE_AI = /logo|emblem|crest|seal|contact|phone|website|e-?mail|icon|header|footer|top band|bottom band/i;
// Quoted words from the reference ("The main heading 'Congratulations'…")
// are removed too, or Qwen-Image writes them onto the new post.
// (Single quotes only count when they enclose words, so "it's" survives.)
const DOUBLE_QUOTED = /["“][^"“”]{1,80}["”]/g;
const SINGLE_QUOTED = /(^|[\s(])['‘][^'’]{1,80}['’](?=[\s.,;:!?)]|$)/g;
const bodyStyle = (style = '') =>
  style
    .replace(DOUBLE_QUOTED, '')
    .replace(SINGLE_QUOTED, '$1')
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !NOT_FOR_THE_AI.test(sentence))
    .join(' ')
    .replace(/\s{2,}/g, ' ');

// (No category name in here either — "Placement congratulations" would be
// printed on an admissions post.)
function buildPrompt(info, fields, imagePrompt, side, photoStyle) {
  const texts = [
    `the main heading "${fields.headline}" in ${info.headingStyle || 'large bold lettering'}`,
    fields.subheadline && `under it, smaller, "${fields.subheadline}"`,
    fields.personName && `the name "${fields.personName}", large and bold`,
    fields.personRole && `under the name, "${fields.personRole}"`,
    fields.details && `short lines of key details: "${fields.details}"`,
    fields.callToAction && `towards the bottom, in a rounded banner, "${fields.callToAction}"`,
  ].filter(Boolean);
  const colours = [...new Set((info.palette || []).map(colourName))];

  // The header and footer bars are drawn empty: the real logo, badges,
  // organisation name and contact details go on them afterwards, exactly.
  return (
    'A brand-new social media post graphic in portrait format: a flat, full-bleed design that fills ' +
    'the entire canvas edge to edge — not a mockup, no frame, border or background around it. ' +
    `Style: ${bodyStyle(info.style)} ` +
    (colours.length ? `Colours: ${colours.join(', ')}. ` : '') +
    'Across the very top, a plain light header bar that is completely empty. ' +
    'Across the very bottom, a plain dark footer bar that is completely empty. ' +
    `Between them: ${texts.join('; ')}. ` +
    (side
      ? `In the ${FREE_AREA_WORDS[side]}, ${PHOTO_FRAME_WORDS[photoStyle] || PHOTO_FRAME_WORDS.circle} filling most ` +
        'of that half, with no person, picture or text inside it — a photo will be placed there later. ' +
        'All the text sits in the other half, and every line of text ends well before the frame; keep the name ' +
        'and details at a moderate size so each line fits in its half. '
      : `Imagery: ${imagePrompt} `) +
    'Write each of those texts exactly once, spelt exactly as given, and no other text anywhere: no contact ' +
    'details, no website, no phone numbers, no labels, no numbers or codes, no rows of icons, no logos, ' +
    'emblems, seals or crests. Clean, professional, generous spacing.'
  );
}

// ---- Where the photo goes ----
// Qwen-Image doesn't always keep its text out of the space left for the
// photo, and sometimes draws a made-up person in a frame there. So the
// finished poster is read back (Qwen3-VL boxes every text line and photo)
// and the real photo goes over the drawn frame if that is clear of text,
// otherwise in the largest text-free spot of the body.

// Width ÷ height of the photo box, by style.
const PHOTO_ASPECT = { circle: 1, rect: 0.8, cutout: 0.8 };
// Body of the poster, between the header and footer bars (0-1 of height).
const BODY = { top: HEADER_H + 0.015, bottom: 1 - FOOTER_H - 0.015 };
// Gap kept between the photo and any text, as 0-1 of the poster width.
const TEXT_GAP = 0.015;
// Photo width (0-1 of the poster width): GOOD is accepted at once; anything
// down to SMALL is used after the last attempt, with a note to the user.
const GOOD_PHOTO = 0.32;
const SMALL_PHOTO = 0.22;

const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// Boxes in pixels: [x1, y1, x2, y2] (0-1) → { x, y, w, h }, grown by `grow` px.
const toPx = ([x1, y1, x2, y2], W, H, grow = 0) => ({
  x: x1 * W - grow,
  y: y1 * H - grow,
  w: (x2 - x1) * W + 2 * grow,
  h: (y2 - y1) * H + 2 * grow,
});

function fitsBody(box, W, H) {
  return box.x >= W * 0.02 && box.x + box.w <= W * 0.98 && box.y >= H * BODY.top && box.y + box.h <= H * BODY.bottom;
}

// The photo box for this poster: { box (px), widthShare, coversDrawn, good },
// or null if the poster couldn't be read (the fixed area is used then).
async function choosePhotoSpot(posterUri, info, W, H) {
  const found = await locateTextAndPhotos(posterUri);
  if (!found) return null;

  const aspect = PHOTO_ASPECT[info.photoStyle] || 1;
  const gap = W * TEXT_GAP;
  const text = found.text.map((b) => toPx(b, W, H, gap));
  const clear = (box) => fitsBody(box, W, H) && !text.some((t) => overlaps(box, t));
  const drawn = found.photos.map((b) => toPx(b, W, H)).sort((a, b) => b.w * b.h - a.w * a.h)[0];
  const result = (box, coversDrawn) => {
    const widthShare = box.w / W;
    return { box, widthShare, coversDrawn, good: widthShare >= GOOD_PHOTO && (coversDrawn || !drawn) };
  };

  // 1. Exactly over the frame Qwen-Image drew (a little larger, so its ring
  //    and any made-up face are hidden), shrinking to the frame itself.
  if (drawn) {
    const cx = drawn.x + drawn.w / 2;
    const cy = drawn.y + drawn.h / 2;
    for (const scale of [1.06, 1]) {
      const h = Math.max(drawn.h, drawn.w / aspect) * scale;
      const box = { x: cx - (h * aspect) / 2, y: cy - h / 2, w: h * aspect, h };
      if (clear(box)) return result(box, true);
    }
  }

  // 2. The largest text-free box, nearest the drawn frame (or the reference's
  //    photo side) among those of that size.
  const side = PHOTO_AREA[info.photoSide] || PHOTO_AREA.right;
  const target = drawn
    ? { x: drawn.x + drawn.w / 2, y: drawn.y + drawn.h / 2 }
    : { x: W * (side.x + side.w / 2), y: H * (side.y + side.h / 2) };
  const step = Math.max(4, Math.round(W * 0.01));
  const maxH = Math.min(H * (BODY.bottom - BODY.top), (W * 0.96) / aspect);
  for (let h = maxH; h * aspect >= W * SMALL_PHOTO; h -= step) {
    const w = h * aspect;
    let best = null;
    for (let y = H * BODY.top; y + h <= H * BODY.bottom; y += step) {
      for (let x = W * 0.02; x + w <= W * 0.98; x += step) {
        const box = { x, y, w, h };
        if (!clear(box)) continue;
        const dist = Math.hypot(x + w / 2 - target.x, y + h / 2 - target.y);
        if (!best || dist < best.dist) best = { box, dist };
      }
    }
    if (best) {
      const coversDrawn =
        !!drawn &&
        best.box.x <= drawn.x + drawn.w * 0.1 &&
        best.box.y <= drawn.y + drawn.h * 0.1 &&
        best.box.x + best.box.w >= drawn.x + drawn.w * 0.9 &&
        best.box.y + best.box.h >= drawn.y + drawn.h * 0.9;
      return result(best.box, coversDrawn);
    }
  }
  return { box: null, widthShare: 0, coversDrawn: false, good: false };
}

// Places the photo the way the reference shows people: in `spot` (pixels)
// when one was found clear of the text, else in the fixed photo area.
async function placePhoto(posterUri, photo, info, spot) {
  const poster = await loadImage(posterUri);
  const W = poster.naturalWidth;
  const H = poster.naturalHeight;
  const a = PHOTO_AREA[info.photoSide] || PHOTO_AREA.right;
  const area = spot || { x: W * a.x, y: H * a.y, w: W * a.w, h: H * a.h };
  const accent = info.palette?.[0] || '#6C5CE7';

  if (photo.isPerson && info.photoStyle === 'cutout') {
    const maskUri = await segmentImage({ uri: photo.uri, prompt: 'person' });
    if (maskUri && (await maskCoverage(maskUri)) > 0.05) {
      return drawInBox(posterUri, await cutOut(photo.uri, maskUri), area, { fit: 'stand' });
    }
  }

  if (info.photoStyle === 'rect') {
    const framed = await drawInBox(posterUri, photo.uri, area, { fit: 'cover' });
    return drawRing(framed, area, accent, Math.max(4, W * 0.008), { shape: 'rect' });
  }

  // Circle (also the fallback): head-and-shoulders for a person.
  const d = spot ? Math.min(area.w, area.h) : Math.min(area.w, area.h * 0.85);
  const circle = { x: area.x + (area.w - d) / 2, y: area.y + (area.h - d) / 2, w: d, h: d };
  const uri = photo.isPerson ? await cropFace(photo.uri, photo.faceBox) : photo.uri;
  const inCircle = await drawInBox(posterUri, uri, circle, { fit: 'cover', circle: true });
  return drawRing(inCircle, circle, accent, Math.max(5, d * 0.025), { shape: 'circle' });
}

// photo: { uri, isPerson, faceBox } or null.
export async function composeDesigned({ reference, fields, imagePrompt, photo, brandKit, onStep }) {
  onStep?.('style');
  const info = await ensureStyleInfo(reference);

  // The whole poster at about 1 megapixel, in the reference's shape.
  const aspect = reference.width / reference.height;
  const width = round16(Math.sqrt(1_000_000 * aspect));
  const size = { width, height: round16(width / aspect) };
  const side = photo ? info.photoSide || 'right' : null;
  const prompt = buildPrompt(info, fields, imagePrompt, side, info.photoStyle);

  // Every line it was asked to write must read back correctly (small text
  // gets garbled too: "Infosys" → "Infosjitus"), and a photo needs a big
  // enough spot clear of the text. A second poster is drawn if the first
  // fails either check; the better of the two is kept.
  const mustRead = [
    fields.headline,
    fields.subheadline,
    fields.personName,
    fields.personRole,
    ...String(fields.details || '').split('·'),
    fields.callToAction,
  ]
    .map((t) => String(t || '').trim())
    .filter(Boolean);
  const score = (c) => [
    -c.missing.length,
    c.spot === null || c.spot?.good ? 1 : 0,
    c.spot?.widthShare ?? 1,
  ];
  const better = (a, b) => {
    const [sa, sb] = [score(a), score(b)];
    const i = sa.findIndex((v, k) => v !== sb[k]);
    return i >= 0 && sa[i] > sb[i];
  };
  let best = null;
  // A slow GPU (laptop on battery) would make a redraw take another ~10 min,
  // so after a slow drawing the best one so far is kept, with its warnings.
  let slow = false;
  for (let attempt = 1; attempt <= 2 && !(attempt > 1 && slow); attempt += 1) {
    onStep?.('image');
    const onSlow = () => {
      slow = true;
      onStep?.('slow');
    };
    const uri = (await generateImage({ imagePrompt: prompt, size, onSlow })).uri;
    onStep?.('checking');
    const text = normalise(await readImageText(uri));
    const candidate = {
      uri,
      missing: mustRead.filter((t) => !text.includes(normalise(t))),
      // null: the poster couldn't be read for boxes, so the fixed area is used.
      spot: photo ? await choosePhotoSpot(uri, info, size.width, size.height) : null,
    };
    if (!best || better(candidate, best)) best = candidate;
    if (!best.missing.length && (best.spot === null || best.spot.good)) break;
  }

  let poster = best.uri;
  const missing = best.missing;
  let photoCrowded = false;
  if (photo) {
    onStep?.('photo');
    const spot = best.spot;
    const usable = spot?.box && spot.widthShare >= SMALL_PHOTO;
    photoCrowded = spot !== null && !(usable && spot.good);
    poster = await placePhoto(poster, photo, info, usable ? spot.box : null);
  }
  if (brandKit.logoUri) poster = await stampLogo(poster, brandKit.logoUri, LOGO_BOX);
  if (brandKit.badgesUri) poster = await stampLogo(poster, brandKit.badgesUri, BADGES_BOX);
  if (brandKit.orgName) {
    poster = await writeHeader(poster, brandKit.orgName, brandKit.orgLocation, NAME_BOX, {
      color: darkest(info.palette) || '#1F2A6B',
      accent: '#C62828',
    });
  }
  const contact = [brandKit.contactPhone, brandKit.website, brandKit.department].filter(Boolean);
  if (contact.length) poster = await writeFooter(poster, contact, FOOTER_H);

  return { uri: poster, aspect, missing, photoCrowded };
}
