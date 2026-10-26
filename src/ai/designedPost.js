import { describeReferenceStyle, generateImage, readImageText, segmentImage } from './localAi';
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
//   - a person's photo goes in the space Qwen-Image left for it, the way the
//     reference shows people: in a ring (circle), cut out by SAM 3 and
//     standing on the design (cutout), or in a frame (rect);
//   - Qwen3-VL reads the heading and name back; Qwen-Image tries again once
//     if either is misspelt.

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
function buildPrompt(info, fields, imagePrompt, side) {
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
      ? `The ${FREE_AREA_WORDS[side]} is left as plain background with nothing in it — a photo will go there; ` +
        'all the text goes on the other side. '
      : `Imagery: ${imagePrompt} `) +
    'Write each of those texts exactly once, spelt exactly as given, and no other text anywhere: no contact ' +
    'details, no website, no phone numbers, no labels, no numbers or codes, no rows of icons, no logos, ' +
    'emblems, seals or crests. Clean, professional, generous spacing.'
  );
}

// Places the photo in the free area the way the reference shows people.
async function placePhoto(posterUri, photo, info) {
  const poster = await loadImage(posterUri);
  const W = poster.naturalWidth;
  const H = poster.naturalHeight;
  const a = PHOTO_AREA[info.photoSide] || PHOTO_AREA.right;
  const area = { x: W * a.x, y: H * a.y, w: W * a.w, h: H * a.h };
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
  const d = Math.min(area.w, area.h * 0.85);
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
  const prompt = buildPrompt(info, fields, imagePrompt, side);

  // The heading and the name must read back correctly.
  const mustRead = [fields.headline, fields.personName].filter(Boolean);
  let poster = null;
  let missing = mustRead;
  for (let attempt = 1; attempt <= 2 && missing.length; attempt += 1) {
    onStep?.('image');
    poster = (await generateImage({ imagePrompt: prompt, size })).uri;
    onStep?.('checking');
    const text = normalise(await readImageText(poster));
    missing = mustRead.filter((t) => !text.includes(normalise(t)));
  }

  if (photo) {
    onStep?.('photo');
    poster = await placePhoto(poster, photo, info);
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

  return { uri: poster, aspect, missing };
}
