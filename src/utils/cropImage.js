import { Platform } from 'react-native';

// Crops uploaded images for templates, using the browser's canvas. Every
// function returns a data: URI (so the result can be exported as part of a
// PNG), and on native returns the image unchanged — there's no canvas there.

function loadImage(uri) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the uploaded image.'));
    img.src = uri;
  });
}

function draw(img, sx, sy, sw, sh, outW, outH) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(outW);
  canvas.height = Math.round(outH);
  canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.92);
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// Square head-and-shoulders crop for a photo circle. faceBox is
// [x1, y1, x2, y2] in 0-1 of the image size (from Qwen3-VL), or null to
// fall back to a centred square.
export async function cropFace(uri, faceBox, outSize = 800) {
  if (Platform.OS !== 'web') return uri;

  const img = await loadImage(uri);
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  let side = Math.min(W, H);
  let cx = W / 2;
  let cy = H / 2;

  if (faceBox) {
    const [x1, y1, x2, y2] = faceBox;
    const faceW = (x2 - x1) * W;
    const faceH = (y2 - y1) * H;
    // Qwen3-VL's "face" box is really the whole head (hair included). The
    // head takes ~55% of the circle, a little above centre so the
    // shoulders show — like a typical ID / portrait crop.
    side = Math.min(Math.max(faceW, faceH) * 1.8, W, H);
    cx = ((x1 + x2) / 2) * W;
    cy = ((y1 + y2) / 2) * H + faceH * 0.3;
  }

  const sx = clamp(cx - side / 2, 0, W - side);
  const sy = clamp(cy - side / 2, 0, H - side);
  return draw(img, sx, sy, side, side, Math.min(outSize, side), Math.min(outSize, side));
}

// Shrinks an image to at most maxWidth wide (as JPEG), so reference posts
// fit in the browser's ~5 MB storage. Returns { uri, width, height }.
export async function downscaleImage(uri, maxWidth = 1080) {
  if (Platform.OS !== 'web') return { uri, width: null, height: null };

  const img = await loadImage(uri);
  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0, width, height);
  return { uri: canvas.toDataURL('image/jpeg', 0.88), width, height };
}

// Largest crop of the given width÷height ratio, centred on the face if
// there is one, otherwise on the middle of the image.
export async function cropToAspect(uri, aspect, faceBox = null, maxWidth = 1600) {
  if (Platform.OS !== 'web') return uri;

  const img = await loadImage(uri);
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  let sw = W;
  let sh = W / aspect;
  if (sh > H) {
    sh = H;
    sw = H * aspect;
  }

  const cx = faceBox ? ((faceBox[0] + faceBox[2]) / 2) * W : W / 2;
  const cy = faceBox ? ((faceBox[1] + faceBox[3]) / 2) * H : H / 2;

  const sx = clamp(cx - sw / 2, 0, W - sw);
  const sy = clamp(cy - sh / 2, 0, H - sh);
  const outW = Math.min(maxWidth, sw);
  return draw(img, sx, sy, sw, sh, outW, outW / aspect);
}

// The main colours of an image, measured from its pixels (most common
// first), skipping near-white and near-grey: a design's real palette for
// Qwen-Image, rather than the vision model's guess.
export async function dominantColors(uri, count = 5) {
  if (Platform.OS !== 'web') return [];

  const img = await loadImage(uri);
  const W = Math.min(200, img.naturalWidth);
  const H = Math.round((W * img.naturalHeight) / img.naturalWidth);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;

  const buckets = new Map();
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (min > 225 || max - min < 28) continue; // white / grey
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const bucket = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    bucket.n += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  const toHex = (v) => Math.round(v).toString(16).padStart(2, '0');
  const picked = [];
  [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .forEach(({ n, r, g, b }) => {
      const c = [r / n, g / n, b / n];
      const distinct = picked.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > 60);
      if (picked.length < count && distinct) picked.push(c);
    });
  return picked.map(([r, g, b]) => `#${toHex(r)}${toHex(g)}${toHex(b)}`);
}
