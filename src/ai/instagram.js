// Publishing a finished post to Instagram, through the AI laptop's sharing
// proxy (scripts/share-ai.js). The Instagram token stays on that laptop; the
// proxy checks the signed-in account (Firebase ID token) is allowed to post.
// Only available while using a shared AI link (aiServer().shared).

import { aiServer } from './aiServer';

function instagramBase() {
  const server = aiServer();
  return server.shared ? server.comfyui.replace(/\/comfy$/, '/instagram') : null;
}

// { enabled, username } — enabled only when the laptop has Instagram set up.
export async function getInstagramStatus() {
  const base = instagramBase();
  if (!base) return { enabled: false, username: '' };
  try {
    const res = await fetch(`${base}/status`);
    return res.ok ? await res.json() : { enabled: false, username: '' };
  } catch {
    return { enabled: false, username: '' };
  }
}

// The account's followers and posts (likes, comments, type, time) for the
// Analytics page, or null when this account has none (not allowed, or not
// using the shared AI link).
export async function getInstagramAnalytics(idToken) {
  const base = instagramBase();
  if (!base || !idToken) return null;
  try {
    const res = await fetch(`${base}/analytics`, { headers: { Authorization: `Bearer ${idToken}` } });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

function loadImage(uri) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the poster.'));
    img.src = uri;
  });
}

// Instagram takes JPEGs between 4:5 (portrait) and 1.91:1 (landscape). A
// taller or wider poster is padded, never cropped, so the header and footer
// stay whole; the padding uses the colour along the poster's edges.
export async function toInstagramJpeg(uri) {
  const img = await loadImage(uri);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const aspect = w / h;
  const target = Math.min(1.91, Math.max(0.8, aspect));
  const outW = 1080;
  const outH = Math.round(outW / target);
  const scale = Math.min(outW / w, outH / h);
  const dw = Math.round(w * scale);
  const dh = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');

  // Average colour of the strip that will be padded against.
  const probe = document.createElement('canvas');
  probe.width = w;
  probe.height = h;
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  pctx.drawImage(img, 0, 0);
  const strip = aspect < target ? pctx.getImageData(0, 0, Math.max(1, Math.round(w * 0.02)), h) : pctx.getImageData(0, 0, w, Math.max(1, Math.round(h * 0.02)));
  let [r, g, b] = [0, 0, 0];
  for (let i = 0; i < strip.data.length; i += 4) {
    r += strip.data[i];
    g += strip.data[i + 1];
    b += strip.data[i + 2];
  }
  const n = strip.data.length / 4;
  ctx.fillStyle = `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, Math.round((outW - dw) / 2), Math.round((outH - dh) / 2), dw, dh);
  return canvas.toDataURL('image/jpeg', 0.92);
}

// Returns the post's Instagram link. idToken: the signed-in account's
// Firebase ID token.
export async function publishToInstagram({ imageUri, caption, idToken }) {
  const base = instagramBase();
  if (!base) throw new Error('Posting to Instagram needs the shared AI link from the laptop running `npm run share-ai`.');
  const image = await toInstagramJpeg(imageUri);
  let res;
  try {
    res = await fetch(`${base}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ image, caption }),
    });
  } catch {
    throw new Error("Couldn't reach the sharing laptop. Check it's on and `npm run share-ai` is running.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Instagram did not accept the post.');
  return data.url;
}
