// Canvas helpers for finishing designed posts: SAM 3 cut-outs, framed
// photos and the real logo. Web only (callers check). Every image in and out
// is a data: URI or URL; boxes are { x, y, w, h } in pixels of the image.

export function loadImage(uri) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read an image.'));
    img.src = uri;
  });
}

function canvasOf(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w);
  canvas.height = Math.round(h);
  return [canvas, canvas.getContext('2d')];
}

const toPng = (canvas) => canvas.toDataURL('image/png');

// Is there any white in a mask? (SAM 3 found something.)
export async function maskCoverage(maskUri) {
  const img = await loadImage(maskUri);
  const [canvas, ctx] = canvasOf(img.naturalWidth, img.naturalHeight);
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let on = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] > 127) on += 1;
  return on / (d.length / 4);
}

// Paints `overUri` onto `baseUri` only where the mask is white, with the
// mask's edge softened by `feather` px. `at` places the over-image (and
// its mask) on the base; by default both cover the whole base.
export async function blendMasked(baseUri, overUri, maskUri, { at = null, feather = 2 } = {}) {
  const base = await loadImage(baseUri);
  const over = await loadImage(overUri);
  const mask = await loadImage(maskUri);
  const W = base.naturalWidth;
  const H = base.naturalHeight;
  const place = at || { x: 0, y: 0, w: W, h: H };

  // The over-image with the (softened) mask as its alpha.
  const [layer, lctx] = canvasOf(place.w, place.h);
  lctx.filter = feather ? `blur(${feather}px)` : 'none';
  lctx.drawImage(mask, 0, 0, place.w, place.h);
  lctx.filter = 'none';
  const m = lctx.getImageData(0, 0, layer.width, layer.height);
  lctx.clearRect(0, 0, layer.width, layer.height);
  lctx.drawImage(over, 0, 0, place.w, place.h);
  const o = lctx.getImageData(0, 0, layer.width, layer.height);
  for (let i = 0; i < o.data.length; i += 4) o.data[i + 3] = m.data[i];
  lctx.putImageData(o, 0, 0);

  const [canvas, ctx] = canvasOf(W, H);
  ctx.drawImage(base, 0, 0);
  ctx.drawImage(layer, place.x, place.y);
  return toPng(canvas);
}

// Cuts the white part of a mask out of an image (soft edges): a person
// without their background.
export async function cutOut(uri, maskUri, feather = 1.5) {
  const img = await loadImage(uri);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const [blank] = canvasOf(W, H);
  return blendMasked(toPng(blank), uri, maskUri, { feather });
}

// Draws an image into a box on the base: 'cover' fills it (optionally
// clipped to a circle); 'contain' fits it inside, centred (logos);
// 'stand' fits a cut-out person inside it, standing on the bottom edge.
export async function drawInBox(baseUri, uri, box, { fit = 'cover', circle = false } = {}) {
  const base = await loadImage(baseUri);
  const img = await loadImage(uri);
  const [canvas, ctx] = canvasOf(base.naturalWidth, base.naturalHeight);
  ctx.drawImage(base, 0, 0);

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  ctx.save();
  if (circle) {
    ctx.beginPath();
    ctx.ellipse(box.x + box.w / 2, box.y + box.h / 2, box.w / 2, box.h / 2, 0, 0, Math.PI * 2);
    ctx.clip();
  }
  if (fit === 'stand' || fit === 'contain') {
    const s = Math.min(box.w / iw, box.h / ih);
    const top = fit === 'stand' ? box.y + box.h - ih * s : box.y + (box.h - ih * s) / 2;
    ctx.drawImage(img, box.x + (box.w - iw * s) / 2, top, iw * s, ih * s);
  } else {
    const s = Math.max(box.w / iw, box.h / ih);
    ctx.drawImage(img, box.x + (box.w - iw * s) / 2, box.y + (box.h - ih * s) / 2, iw * s, ih * s);
  }
  ctx.restore();
  return toPng(canvas);
}


// A coloured frame around a box: a ring for a circle, a border for a rect.
export async function drawRing(baseUri, box, color, width, { shape = 'circle' } = {}) {
  const base = await loadImage(baseUri);
  const [canvas, ctx] = canvasOf(base.naturalWidth, base.naturalHeight);
  ctx.drawImage(base, 0, 0);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.ellipse(box.x + box.w / 2, box.y + box.h / 2, box.w / 2, box.h / 2, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(box.x, box.y, box.w, box.h);
  }
  ctx.stroke();
  return toPng(canvas);
}

// The real logo (or badges image) on a white rounded card in a box given as
// 0-1 of the image — an image model can't draw a logo exactly, so it's told
// to leave this spot empty and the real one is placed here.
export async function stampLogo(baseUri, logoUri, box01) {
  const base = await loadImage(baseUri);
  const logo = await loadImage(logoUri);
  const W = base.naturalWidth;
  const H = base.naturalHeight;
  const box = { x: box01.x * W, y: box01.y * H, w: box01.w * W, h: box01.h * H };
  const [canvas, ctx] = canvasOf(W, H);
  ctx.drawImage(base, 0, 0);

  const r = Math.min(box.w, box.h) * 0.12;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, r);
  ctx.fill();

  const pad = Math.min(box.w, box.h) * 0.06;
  const s = Math.min((box.w - pad * 2) / logo.naturalWidth, (box.h - pad * 2) / logo.naturalHeight);
  const lw = logo.naturalWidth * s;
  const lh = logo.naturalHeight * s;
  ctx.drawImage(logo, box.x + (box.w - lw) / 2, box.y + (box.h - lh) / 2, lw, lh);
  return toPng(canvas);
}

// Writes the contact details along the footer bar (the bottom `height01`
// of the image), exactly as typed in Brand Kit, in white with a soft
// shadow so they read on any bar colour.
export async function writeFooter(baseUri, items, height01) {
  const base = await loadImage(baseUri);
  const W = base.naturalWidth;
  const H = base.naturalHeight;
  const [canvas, ctx] = canvasOf(W, H);
  ctx.drawImage(base, 0, 0);

  const barTop = H * (1 - height01);
  const text = items.join('   •   ');
  let size = H * height01 * 0.32;
  const font = (px) => `600 ${px}px Poppins_600SemiBold, Poppins, Arial, sans-serif`;
  ctx.font = font(size);
  while (size > 10 && ctx.measureText(text).width > W * 0.92) {
    size -= 1;
    ctx.font = font(size);
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = size * 0.25;
  ctx.fillText(text, W / 2, barTop + (H - barTop) / 2);
  return toPng(canvas);
}

// Writes the organisation name (its lines as typed in Brand Kit) and its
// location line in a box given as 0-1 of the image, fitted to the box.
export async function writeHeader(baseUri, name, location, box01, { color, accent }) {
  const base = await loadImage(baseUri);
  const W = base.naturalWidth;
  const H = base.naturalHeight;
  const box = { x: box01.x * W, y: box01.y * H, w: box01.w * W, h: box01.h * H };
  const [canvas, ctx] = canvasOf(W, H);
  ctx.drawImage(base, 0, 0);

  const lines = name.split(/\n+/).map((l) => l.trim().toUpperCase()).filter(Boolean);
  if (location) lines.push(location.trim().toUpperCase());
  const font = (px) => `700 ${px}px Poppins_700Bold, Poppins, Arial, sans-serif`;
  let size = box.h / (lines.length * 1.18);
  ctx.font = font(size);
  while (size > 8 && lines.some((l) => ctx.measureText(l).width > box.w)) {
    size -= 1;
    ctx.font = font(size);
  }

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const top = box.y + (box.h - lines.length * size * 1.18) / 2;
  lines.forEach((line, i) => {
    ctx.fillStyle = location && i === lines.length - 1 ? accent : color;
    ctx.fillText(line, box.x, top + i * size * 1.18);
  });
  return toPng(canvas);
}
