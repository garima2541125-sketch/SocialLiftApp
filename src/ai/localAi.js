import { POST_TYPES, DEFAULT_POST_TYPE, headingOf, isReferenceType } from './postTypes';
import { aiServer } from './aiServer';

// Free, fully local post generation:
//   - Qwen3-VL via Ollama looks at uploaded images (person? logo? where's the face?)
//   - Qwen3 via Ollama picks the post type, pulls out its details, writes the caption
//   - Qwen-Image via ComfyUI paints a picture when the post needs one
//
// All of it runs on the developer's own machine, so this only works while Ollama
// and ComfyUI are running (see docs/LOCAL_AI_SETUP.md). The URLs are not
// secrets — nothing here needs an API key — which is why EXPO_PUBLIC_ is fine.

// Read on every request, so opening a shared-server link takes effect at once
// (see aiServer.js).
const ollamaUrl = () => aiServer().ollama;
const comfyUrl = () => aiServer().comfyui;
const CAPTION_MODEL = process.env.EXPO_PUBLIC_CAPTION_MODEL || 'qwen3:8b';
const VISION_MODEL = process.env.EXPO_PUBLIC_VISION_MODEL || 'qwen3-vl:4b-instruct';

const IMAGE_FILES = {
  unet: 'qwen-image-2512-Q4_K_S.gguf',
  lora: 'Qwen-Image-2512-Lightning-4steps-V1.0-bf16.safetensors',
  textEncoder: 'Qwen2.5-VL-7B-Instruct-Q4_K_M.gguf',
  vae: 'Qwen_Image-VAE.safetensors',
};

// Kept small on purpose — the GPU this was built on has 8 GB of VRAM.
// Both sides must be multiples of 16.
const IMAGE_SIZES = {
  Instagram: { width: 1024, height: 1024 },
  LinkedIn: { width: 1216, height: 688 },
};

// Width ÷ height of a post image on each platform — uploaded photos are
// cropped to match the generated ones.
export function platformAspect(platform) {
  const { width, height } = IMAGE_SIZES[platform] || IMAGE_SIZES.Instagram;
  return width / height;
}

const POLL_INTERVAL_MS = 1500;
// Plugged in, an image takes ~1.5 min on an 8 GB laptop GPU; on battery the
// GPU is throttled and the same image takes 7-11 min. So there's no short
// time limit: the app waits as long as ComfyUI is still working on the job,
// says why it's slow after SLOW_AFTER_MS, and only gives up at the hard limit
// or when ComfyUI has lost the job (restarted, cancelled from its window).
const SLOW_AFTER_MS = 3 * 60 * 1000;
const IMAGE_HARD_LIMIT_MS = 40 * 60 * 1000;
const QUEUE_CHECK_MS = 20 * 1000;

const NOT_RUNNING_MESSAGE = (name, url) =>
  aiServer().shared
    ? `Couldn't reach ${name} on the shared AI laptop. Ask its owner to check that the laptop is on and \`npm run share-ai\` is still running. If they restarted it, open the new link they send you.`
    : `Couldn't reach ${name} at ${url}. Make sure it's running on this computer (see docs/LOCAL_AI_SETUP.md).`;

// A busy ComfyUI on a laptop short of memory can miss a request for a few
// seconds, so a connection that fails straight away is retried. A request
// that failed after running for a while is NOT sent again: the AI laptop is
// still working on it, and a second copy would only queue behind the first.
const CONNECT_ATTEMPTS = 4;
const CONNECT_RETRY_MS = 3000;
const QUICK_FAILURE_MS = 10 * 1000;

// ---- One GPU, taken in turns ----
// Qwen3 (Ollama) and Qwen-Image (ComfyUI) share one 8 GB GPU, possibly with
// other people generating through the shared link. Running both at once
// starves them and an image can stall for good, so before using either, the
// app waits until neither is busy. onGpuWait(fn) gets fn(true) when a wait
// starts and fn(false) when it ends, for the progress message.
const GPU_WAIT_LIMIT_MS = 20 * 60 * 1000;
let gpuWaitListener = null;
export function onGpuWait(fn) {
  gpuWaitListener = fn;
}

async function gpuBusy() {
  try {
    const [queue, ps] = await Promise.all([
      fetch(`${comfyUrl()}/queue`).then((r) => r.json()),
      fetch(`${ollamaUrl()}/api/ps`).then((r) => r.json()),
    ]);
    return queue.queue_running.length + queue.queue_pending.length > 0 || (ps.models || []).length > 0;
  } catch {
    return false; // can't tell: the request itself will report a real problem
  }
}

async function waitForFreeGpu() {
  const startedAt = Date.now();
  let waiting = false;
  try {
    while (await gpuBusy()) {
      if (!waiting) {
        waiting = true;
        gpuWaitListener?.(true);
      }
      if (Date.now() - startedAt > GPU_WAIT_LIMIT_MS) {
        throw new Error('The AI laptop has been busy with other posts for 20 minutes. Try again in a while.');
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  } finally {
    if (waiting) gpuWaitListener?.(false);
  }
}

async function request(name, baseUrl, path, options) {
  if (name === 'Ollama' && options?.method === 'POST') await waitForFreeGpu();
  let res;
  for (let attempt = 1; !res; attempt += 1) {
    const sentAt = Date.now();
    try {
      res = await fetch(`${baseUrl}${path}`, options);
    } catch (error) {
      if (Date.now() - sentAt > QUICK_FAILURE_MS) {
        throw new Error(
          `${name} took too long to answer — the AI laptop may be busy or on battery. Wait a minute, then try again.`
        );
      }
      if (attempt >= CONNECT_ATTEMPTS) throw new Error(NOT_RUNNING_MESSAGE(name, baseUrl));
      await new Promise((resolve) => setTimeout(resolve, CONNECT_RETRY_MS * attempt));
    }
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${name} returned ${res.status}${body ? `: ${body.slice(0, 300)}` : ''}`);
  }
  const data = await res.json();
  // Through the sharing proxy, an Ollama error arrives as {"error": "..."}
  // with status 200 (the proxy has already started its reply).
  if (data && typeof data.error === 'string') throw new Error(`${name}: ${data.error}`);
  return data;
}

async function ollamaJson({ model, system, user, images, options }) {
  const data = await request('Ollama', ollamaUrl(), '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user, ...(images ? { images } : {}) },
      ],
      format: 'json',
      think: false,
      stream: false,
      // Unload straight away so the next model (or Qwen-Image) gets the GPU.
      keep_alive: 0,
      ...(options ? { options } : {}),
    }),
  });

  try {
    return JSON.parse(data.message?.content || '');
  } catch (error) {
    throw new Error('The AI replied with something that was not valid JSON. Try again.');
  }
}

// =========================
// IMAGE ANALYSIS (Qwen3-VL via Ollama)
// Works out what an uploaded image is, so it can be put in the right place
// (a person photo goes in a template's photo circle, a logo in a logo box…)
// and cropped around the face.
// =========================

export const IMAGE_KINDS = ['person', 'group', 'logo', 'event', 'product', 'poster', 'document', 'other'];

export async function analyzeImage(dataUri) {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);

  const parsed = await ollamaJson({
    model: VISION_MODEL,
    system:
      'You look at one image uploaded for a social media post. Reply with JSON only, shaped as ' +
      '{"kind": string, "description": string, "text": string, "faceBox": [x1, y1, x2, y2] or null}. ' +
      '"kind" is exactly one of: "person" (one person is the main subject — portrait, selfie, ID photo), ' +
      '"group" (several people), "logo" (a logo, emblem or wordmark), "event" (an event, venue, campus or scene photo), ' +
      '"product", "poster" (a designed graphic, flyer or poster with lots of text), "document", "other". ' +
      '"description" is one short sentence. "text" is any clearly readable text (for a logo, the brand name), else "". ' +
      '"faceBox" is the bounding box of the main person\'s face in 0-1000 coordinates, or null if there is no face.',
    user: 'Analyse this image.',
    images: [base64],
    options: { temperature: 0, seed: 7 },
  });

  const kind = IMAGE_KINDS.includes(parsed.kind) ? parsed.kind : 'other';
  const box = Array.isArray(parsed.faceBox) ? parsed.faceBox.map(Number) : null;
  const validBox =
    box && box.length === 4 && box.every((n) => n >= 0 && n <= 1000) && box[2] > box[0] && box[3] > box[1];

  return {
    kind,
    description: String(parsed.description || '').trim(),
    text: String(parsed.text || '').trim(),
    // Normalised to 0-1 so cropping doesn't need to know the 0-1000 scale.
    faceBox: validBox ? box.map((n) => n / 1000) : null,
  };
}

// =========================
// DESIGN NOTES (Qwen3-VL via Ollama)
// =========================

// Design notes for a reference post, so new posts of any kind can be drawn
// from scratch in the same style (see designedPost.js). The user can read
// and edit them in Brand Kit. The reference image itself is never reused.
export const PHOTO_STYLES = ['circle', 'cutout', 'rect', 'none'];

export async function describeReferenceStyle(dataUri) {
  const parsed = await ollamaJson({
    model: VISION_MODEL,
    system:
      'You study a social media post design so NEW posts can be drawn from scratch in exactly the same visual style. ' +
      'Reply with JSON only, shaped as {"category": string, "style": string, "headingText": string, "headingStyle": string, ' +
      '"palette": [string], "photoStyle": string, "photoSide": string}. ' +
      '"category" is a short name for this kind of post, e.g. "Placement congratulations". ' +
      '"style" is a detailed paragraph an image generator can follow to draw a new design in the same style: ' +
      'background colours and gradients, decorative shapes ' +
      '(waves, ribbons, gold curves, frames) and where they sit, ' +
      'how text is arranged (centred, left-aligned, in pills or banners), spacing and overall feel. ' +
      'Describe the design only — do not mention any names, words, numbers, logos or contact details shown on ' +
      'it, and do not describe its header or footer (the app adds those itself). ' +
      '"headingText" is the main heading exactly as written on the post, e.g. "Congratulations" (the only field ' +
      'that may contain the post\'s own words). ' +
      '"headingStyle" describes the main heading lettering, e.g. "large purple brush-script" or "bold navy serif". ' +
      '"palette" is the 3-6 main colours as hex codes. ' +
      '"photoStyle" is how the main photo of a person is shown: "circle" (in a round frame), "cutout" (person cut out ' +
      'and placed straight on the design), "rect" (in a rectangular frame) or "none". ' +
      '"photoSide" is where that photo sits: "left", "right" or "center".',
    user: 'Write design notes for this post.',
    images: [dataUri.slice(dataUri.indexOf(',') + 1)],
    options: { temperature: 0, seed: 7 },
  });

  return {
    category: String(parsed.category || '').trim(),
    style: String(parsed.style || '').trim(),
    headingText: String(parsed.headingText || '').trim(),
    headingStyle: String(parsed.headingStyle || '').trim(),
    palette: (Array.isArray(parsed.palette) ? parsed.palette : [])
      .map((c) => String(c).trim())
      .filter((c) => /^#[0-9a-f]{6}$/i.test(c))
      .slice(0, 6),
    photoStyle: PHOTO_STYLES.includes(parsed.photoStyle) ? parsed.photoStyle : 'circle',
    photoSide: ['left', 'right', 'center'].includes(parsed.photoSide) ? parsed.photoSide : 'right',
  };
}

// =========================
// PLAN THE POST (Qwen3 via Ollama)
// Picks the post type from the prompt, pulls out the facts its template
// prints, decides which uploaded image goes in which slot, and writes the
// caption. Facts are then checked against the prompt in code, so a template
// never shows a made-up name or number — missing ones are left blank for
// the user to fill in.
// =========================

const NOT_A_COMPANY = ['drive', 'campus', 'college', 'university', 'institute', 'school', 'placement'];

// Small models sometimes "fill in" a value that isn't in the request. A
// detail is only kept if every word / number in it appears in the prompt.
function appearsInPrompt(value, prompt) {
  const words = ` ${prompt.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
  // Also match without spaces, so "40 LPA" counts for a prompt saying "40LPA".
  const squashed = words.replace(/ /g, '');
  const tokens = value.toLowerCase().match(/[a-z0-9]+/g) || [];

  return (
    tokens.length > 0 &&
    tokens.every((t) => words.includes(` ${t} `) || squashed.includes(t))
  );
}

function describeImages(analyses) {
  if (!analyses.length) return 'No images were uploaded.';
  return analyses
    .map(
      (a, i) =>
        `Image ${i + 1}: kind=${a.kind}; ${a.description}` + (a.text ? `; readable text: "${a.text}"` : '')
    )
    .join('\n');
}

function describeType([key, t]) {
  const fields = Object.entries(t.fields).map(([f, d]) => `${f} (${d})`);
  const slots = Object.entries(t.imageSlots).map(([s, d]) => `${s} (takes a ${d.kinds.join('/')} image)`);
  return (
    `- "${key}": ${t.classify}.` +
    (fields.length ? ` Fields: ${fields.join('; ')}.` : '') +
    ` Image slots: ${slots.join('; ')}.`
  );
}

// The account's own designs are listed first, and must win over a built-in
// type whenever they fit the request.
function describePostTypes(postTypes) {
  const entries = Object.entries(postTypes);
  const own = entries.filter(([key]) => isReferenceType(key));
  const builtIn = entries.filter(([key]) => !isReferenceType(key));

  return (
    (own.length
      ? "This account's own designs — if one of these matches the request, you MUST choose it:\n" +
        `${own.map(describeType).join('\n')}\n\nBuilt-in types — only if none of the account's own designs match:\n`
      : '') + builtIn.map(describeType).join('\n')
  );
}

// Small models sometimes still pick a built-in type when the account has
// its own design for the same kind of post (e.g. built-in "Placement
// congratulations" vs a saved "JUET placement congratulations"). If a
// reference's label shares a meaningful word with the built-in type's label,
// use the reference.
const significantWords = (label) => (label.toLowerCase().match(/[a-z]{5,}/g) || []);

function preferOwnDesign(postType, postTypes) {
  if (isReferenceType(postType) || postType === DEFAULT_POST_TYPE) return postType;

  const words = significantWords(postTypes[postType].label);
  const match = Object.entries(postTypes).find(
    ([key, t]) => isReferenceType(key) && significantWords(t.label).some((w) => words.includes(w))
  );
  return match ? match[0] : postType;
}

// Keeps only image→slot assignments that make sense (right kind, each image
// used once), then fills any empty slot with the one obvious leftover image.
function resolveSlots(type, proposed, analyses) {
  const slots = {};
  const used = new Set();

  Object.entries(type.imageSlots).forEach(([slot, def]) => {
    const n = Number(proposed?.[slot]);
    const index = Number.isInteger(n) ? n - 1 : -1;
    if (index >= 0 && index < analyses.length && !used.has(index) && def.kinds.includes(analyses[index].kind)) {
      slots[slot] = index;
      used.add(index);
    } else {
      slots[slot] = null;
    }
  });

  Object.entries(type.imageSlots).forEach(([slot, def]) => {
    if (slots[slot] !== null) return;
    const candidates = analyses
      .map((a, i) => i)
      .filter((i) => !used.has(i) && def.kinds.includes(analyses[i].kind));
    if (candidates.length === 1) {
      slots[slot] = candidates[0];
      used.add(candidates[0]);
    }
  });

  return slots;
}

// postTypes defaults to the built-in types; pass buildPostTypes(references)
// to include the account's own reference designs.
export async function planPost({ prompt, tone, platform, analyses = [], postTypes: allTypes = POST_TYPES }) {
  // Don't offer a built-in type the account has its own design for.
  const postTypes = Object.fromEntries(
    Object.entries(allTypes).filter(([key]) => preferOwnDesign(key, allTypes) === key)
  );

  const system =
    `You plan a ${platform} post. First decide which post type the request is asking for:\n` +
    `${describePostTypes(postTypes)}\n\n` +
    'Reply with JSON only, shaped as ' +
    '{"postType": string, "caption": string, "imagePrompt": string, "fields": object, "slots": object}. ' +
    '"fields" holds the chosen type\'s fields. Copy facts exactly as written in the request and never invent ' +
    'or guess any — use "" for anything the request does not state. ' +
    '"slots" maps each of the chosen type\'s image slots to the number of the uploaded image that belongs there, ' +
    'or null. Only use an image where it fits. ' +
    `"caption" is the finished post text in a ${tone.toLowerCase()} voice, using only facts from the request, ` +
    'with a few relevant hashtags at the end' +
    (platform === 'LinkedIn' ? ' (2-3 at most, professional)' : '') +
    '. "imagePrompt" is a short description of the picture for the post, for an image generator (subject, ' +
    'setting, motifs, lighting, colours; e.g. diyas, rangoli and fireworks for Diwali), with no people or ' +
    'faces unless the request asks for them, and no text, words or logos.';

  const user = `Request: ${prompt}\n\nUploaded images:\n${describeImages(analyses)}`;

  const parsed = await ollamaJson({ model: CAPTION_MODEL, system, user });

  if (!parsed.caption) {
    throw new Error('The AI did not return a caption. Try again.');
  }

  // Nothing matched: a plain post, or (when the account has its own
  // designs) any-kind-of-post in one of them.
  const fallback = postTypes[DEFAULT_POST_TYPE]
    ? DEFAULT_POST_TYPE
    : Object.keys(postTypes).find((key) => key.endsWith(':layout')) || Object.keys(postTypes)[0];
  const chosen = postTypes[parsed.postType] ? parsed.postType : fallback;
  const postType = preferOwnDesign(chosen, postTypes);
  if (postType !== chosen) {
    // The details were pulled out for the built-in type's fields — plan
    // again for the account's own design alone so they match its parts.
    return planPost({ prompt, tone, platform, analyses, postTypes: { [postType]: postTypes[postType] } });
  }
  const type = postTypes[postType];

  const fields = {};
  const creative = new Set(type.creativeFields || []);
  const promptNumbers = new Set(prompt.match(/\d+/g) || []);
  // Removes numbers that aren't in the request (an invented year, date or
  // deadline) from newly written text, keeping the rest of it.
  const dropInventedNumbers = (text) =>
    text
      .replace(/\d+/g, (n) => (promptNumbers.has(n) ? n : ''))
      .replace(/\s+([,.!?:;])/g, '$1')
      .replace(/[\s·,–-]+$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  Object.keys(type.fields).forEach((field) => {
    const value = String(parsed.fields?.[field] ?? '').trim();
    if (creative.has(field)) {
      // Wording can be new (a headline), but any number or date in it must
      // come from the request, so nothing like a deadline gets invented.
      fields[field] = dropInventedNumbers(value);
    } else {
      fields[field] = value && appearsInPrompt(value, prompt) ? value : '';
    }
  });

  // Field names differ between templates (company / companyName…), so
  // these checks go by what the field is about.
  Object.keys(fields).forEach((field) => {
    // "placement drive of JUET Guna College" is not an employer.
    if (/company|employer/i.test(field) && fields[field]) {
      const words = fields[field].toLowerCase().match(/[a-z]+/g) || [];
      if (words.some((w) => NOT_A_COMPANY.includes(w))) fields[field] = '';
    }
    // "40LPA" -> "40 LPA"
    if (/package|salary|ctc/i.test(field)) {
      fields[field] = fields[field].replace(/(\d)([a-z])/gi, '$1 $2');
    }
  });

  if (type.designReference) {
    // The design's own heading when the model left it out.
    if (!fields.headline) fields.headline = headingOf(type.designReference);
    // Each line of the design says something new: no subheadline that
    // repeats the name, no detail already on the name or role lines.
    const flat = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (fields.personName && flat(fields.subheadline).includes(flat(fields.personName))) fields.subheadline = '';
    if (fields.details) {
      const shown = flat(`${fields.personName} ${fields.personRole} ${fields.subheadline}`);
      fields.details = fields.details
        .split('·')
        .map((part) => part.trim())
        .filter((part) => part && !shown.includes(flat(part)))
        .join(' · ');
    }
  }

  return {
    postType,
    caption: dropInventedNumbers(String(parsed.caption)),
    imagePrompt: String(parsed.imagePrompt || prompt).trim(),
    fields,
    slots: resolveSlots(type, parsed.slots, analyses),
  };
}

// =========================
// IMAGE (Qwen-Image via ComfyUI)
// =========================

function buildImageWorkflow({ imagePrompt, width, height, seed }) {
  return {
    1: { class_type: 'UnetLoaderGGUF', inputs: { unet_name: IMAGE_FILES.unet } },
    2: {
      class_type: 'LoraLoaderModelOnly',
      inputs: { model: ['1', 0], lora_name: IMAGE_FILES.lora, strength_model: 1 },
    },
    3: { class_type: 'ModelSamplingAuraFlow', inputs: { model: ['2', 0], shift: 3.1 } },
    4: {
      class_type: 'CLIPLoaderGGUF',
      inputs: { clip_name: IMAGE_FILES.textEncoder, type: 'qwen_image' },
    },
    5: { class_type: 'CLIPTextEncode', inputs: { clip: ['4', 0], text: imagePrompt } },
    6: { class_type: 'CLIPTextEncode', inputs: { clip: ['4', 0], text: '' } },
    7: { class_type: 'VAELoader', inputs: { vae_name: IMAGE_FILES.vae } },
    8: { class_type: 'EmptySD3LatentImage', inputs: { width, height, batch_size: 1 } },
    9: {
      class_type: 'KSampler',
      inputs: {
        model: ['3', 0],
        positive: ['5', 0],
        negative: ['6', 0],
        latent_image: ['8', 0],
        seed,
        // 4 steps + cfg 1 is what the Lightning LoRA is trained for.
        steps: 4,
        cfg: 1,
        sampler_name: 'euler',
        scheduler: 'simple',
        denoise: 1,
      },
    },
    10: { class_type: 'VAEDecode', inputs: { samples: ['9', 0], vae: ['7', 0] } },
    11: { class_type: 'SaveImage', inputs: { images: ['10', 0], filename_prefix: 'sociallift' } },
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Queues a workflow and waits for its SaveImage node's output.
// The image model doesn't fit in the laptop's GPU, so ComfyUI keeps the rest
// in RAM. Left alone, that memory piles up over many images until Windows
// starts paging to disk and each image takes 10+ minutes. Asking ComfyUI to
// let go of its models after every image keeps it flat; the next image just
// reloads them from disk, which costs far less than the paging did.
function freeComfyMemory() {
  return fetch(`${comfyUrl()}/free`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unload_models: true, free_memory: true }),
  }).catch(() => {});
}

// The ComfyUI job this browser tab is waiting for. A job nobody waits for any
// more (the tab started a new one, or was closed) is cancelled, so it can't
// hold up the next image on the GPU for minutes.
let activeJob = null;

function cancelComfyJob(job, { beacon = false } = {}) {
  job.cancelled = true;
  const calls = [
    ['/interrupt', { prompt_id: job.id }], // only stops it if it's the one running
    ['/queue', { delete: [job.id] }], // only removes it if it's still waiting
  ];
  calls.forEach(([path, body]) => {
    const url = `${comfyUrl()}${path}`;
    if (beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([JSON.stringify(body)], { type: 'text/plain' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(
        () => {}
      );
    }
  });
}

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('pagehide', () => {
    if (activeJob && !activeJob.done) cancelComfyJob(activeJob, { beacon: true });
  });
}

class JobCancelled extends Error {}

async function runComfyWorkflow(workflow, outputNode, { onSlow } = {}) {
  try {
    return await pollComfyWorkflow(workflow, outputNode, onSlow);
  } finally {
    freeComfyMemory();
  }
}

async function pollComfyWorkflow(workflow, outputNode, onSlow) {
  if (activeJob && !activeJob.done) cancelComfyJob(activeJob);
  await waitForFreeGpu();

  const queued = await request('ComfyUI', comfyUrl(), '/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });

  const job = { id: queued.prompt_id, done: false, cancelled: false };
  activeJob = job;
  const startedAt = Date.now();
  let lastQueueCheck = startedAt;
  let slowNoted = false;

  try {
    while (Date.now() - startedAt < IMAGE_HARD_LIMIT_MS) {
      await sleep(POLL_INTERVAL_MS);
      if (job.cancelled) throw new JobCancelled('Replaced by a newer request.');

      const history = await request('ComfyUI', comfyUrl(), `/history/${job.id}`);
      const entry = history[job.id];

      if (entry?.status?.status_str === 'error') {
        throw new Error('ComfyUI failed while generating the image. Check the ComfyUI window for details.');
      }
      const image = entry?.outputs?.[outputNode]?.images?.[0];
      if (image) {
        const query = new URLSearchParams({
          filename: image.filename,
          subfolder: image.subfolder || '',
          type: image.type || 'output',
        });
        // Downloaded straight away, so later steps don't depend on ComfyUI
        // staying up (share-ai restarts it when its memory has grown).
        return downloadAsDataUri(`${comfyUrl()}/view?${query.toString()}`);
      }
      if (entry) continue; // finished without an image yet: history catches up next poll

      if (!slowNoted && Date.now() - startedAt > SLOW_AFTER_MS) {
        slowNoted = true;
        onSlow?.();
      }

      // Still running or waiting its turn? If ComfyUI no longer has it at
      // all, it was restarted or the job was cancelled in its window.
      if (Date.now() - lastQueueCheck > QUEUE_CHECK_MS) {
        lastQueueCheck = Date.now();
        const queue = await request('ComfyUI', comfyUrl(), '/queue');
        const has = (list) => (list || []).some((item) => item[1] === job.id);
        if (!has(queue.queue_running) && !has(queue.queue_pending)) {
          const again = await request('ComfyUI', comfyUrl(), `/history/${job.id}`);
          if (!again[job.id]) {
            throw new Error(
              'ComfyUI stopped working on this image (it was restarted, or the job was cancelled). Press Generate to try again.'
            );
          }
        }
      }
    }
    cancelComfyJob(job);
    throw new Error(
      'Image generation took longer than 40 minutes and was stopped. Plug in the laptop running the AI and close other heavy apps, then try again.'
    );
  } catch (error) {
    if (!job.cancelled && !(error instanceof JobCancelled)) cancelComfyJob(job);
    throw error;
  } finally {
    job.done = true;
  }
}

// size: optional { width, height } (multiples of 16); defaults to the
// platform's post size. onSlow is called once if the image is taking much
// longer than usual (laptop on battery, or short of memory).
export async function generateImage({ imagePrompt, platform, size, onSlow }) {
  const { width, height } = size || IMAGE_SIZES[platform] || IMAGE_SIZES.Instagram;
  const seed = Math.floor(Math.random() * 2 ** 32);
  const uri = await runComfyWorkflow(buildImageWorkflow({ imagePrompt, width, height, seed }), '11', { onSlow });
  return { uri, width, height };
}

// =========================
// SEGMENT + INPAINT (SAM 3 and Qwen-Image via ComfyUI)
// SAM 3 outlines things in an image from a word ("person", "text"); Qwen-
// Image then repaints just the outlined area. Together they rebuild parts of
// a reference post so new details look designed in, not pasted on.
// =========================

const SAM_CHECKPOINT = 'sam3.1_multiplex_fp16.safetensors';

// Sends an image (data: URI or URL) to ComfyUI's input folder.
async function uploadToComfy(uri, filename) {
  const blob = await (await fetch(uri)).blob();
  const form = new FormData();
  form.append('image', blob, filename);
  form.append('overwrite', 'true');
  const res = await request('ComfyUI', comfyUrl(), '/upload/image', { method: 'POST', body: form });
  return res.subfolder ? `${res.subfolder}/${res.name}` : res.name;
}

let uploadCount = 0;
const uploadName = () => `sociallift-${Date.now()}-${(uploadCount += 1)}.png`;

// Returns a black-and-white mask image (white = what SAM 3 found), the same
// size as the input, or null if it found nothing.
export async function segmentImage({ uri, prompt, threshold = 0.4 }) {
  const name = await uploadToComfy(uri, uploadName());
  const workflow = {
    1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: SAM_CHECKPOINT } },
    2: { class_type: 'LoadImage', inputs: { image: name } },
    3: { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1], text: prompt } },
    4: {
      class_type: 'SAM3_Detect',
      inputs: {
        model: ['1', 0],
        image: ['2', 0],
        conditioning: ['3', 0],
        threshold,
        refine_iterations: 2,
        individual_masks: false,
      },
    },
    5: { class_type: 'MaskToImage', inputs: { mask: ['4', 0] } },
    6: { class_type: 'SaveImage', inputs: { images: ['5', 0], filename_prefix: 'sociallift-mask' } },
  };

  try {
    return await runComfyWorkflow(workflow, '6');
  } catch (error) {
    // SAM 3 errors out when nothing matches the prompt.
    return null;
  }
}

function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the redrawn image.'));
    reader.readAsDataURL(blob);
  });
}

// A finished image as a data: URI. Retried for about a minute, in case
// ComfyUI is briefly down (restarting) just as the image is fetched.
async function downloadAsDataUri(url) {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size) return blobToDataUri(blob);
      }
    } catch {
      // not reachable yet
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error('Could not download the finished image from the AI laptop. Press Generate to try again.');
}

async function toBase64(uri) {
  const dataUri = uri.startsWith('data:') ? uri : await blobToDataUri(await (await fetch(uri)).blob());
  return dataUri.slice(dataUri.indexOf(',') + 1);
}

// Where the text lines and any photos / photo frames are on a poster
// (Qwen3-VL), as [x1, y1, x2, y2] boxes in 0-1 of the image, so a real photo
// can be placed clear of the text. null if the model's answer can't be used.
export async function locateTextAndPhotos(uri) {
  const toBoxes = (list) =>
    (Array.isArray(list) ? list : [])
      .filter((b) => Array.isArray(b) && b.length === 4 && b.every(Number.isFinite))
      .map(([x1, y1, x2, y2]) => [x1, y1, x2, y2].map((v) => Math.min(1, Math.max(0, v / 1000))))
      .filter(([x1, y1, x2, y2]) => x2 > x1 && y2 > y1);
  try {
    const parsed = await ollamaJson({
      model: VISION_MODEL,
      system:
        'You locate things on a poster image. Reply with JSON only, shaped as ' +
        '{"text": [[x1, y1, x2, y2], ...], "photos": [[x1, y1, x2, y2], ...]}. ' +
        '"text" has one box for every line of text (headings, names, details, banners), tight around the letters. ' +
        '"photos" has one box for every photo of a person or empty photo frame. ' +
        'Coordinates are integers from 0 to 1000 relative to the image width and height.',
      user: 'Locate all text lines and photos.',
      images: [await toBase64(uri)],
      options: { temperature: 0, seed: 7 },
    });
    const text = toBoxes(parsed.text);
    return text.length ? { text, photos: toBoxes(parsed.photos) } : null;
  } catch (error) {
    return null;
  }
}

// Reads all the text in an image (Qwen3-VL), to check that newly written
// text says what it should.
export async function readImageText(uri) {
  const image = await toBase64(uri);

  // Plain text, not JSON: the vision model occasionally breaks JSON, and a
  // check that can't be read should count as "not verified", not crash.
  const data = await request('Ollama', ollamaUrl(), '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        { role: 'system', content: 'Write out every piece of text visible in the image, exactly as written, and nothing else.' },
        { role: 'user', content: 'Read all the text in this image.', images: [image] },
      ],
      think: false,
      stream: false,
      keep_alive: 0,
      options: { temperature: 0, seed: 7 },
    }),
  });
  return String(data.message?.content || '');
}
