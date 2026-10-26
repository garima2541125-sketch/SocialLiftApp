import { POST_TYPES, DEFAULT_POST_TYPE, isReferenceType } from './postTypes';

// Free, fully local post generation:
//   - Qwen3-VL via Ollama looks at uploaded images (person? logo? where's the face?)
//   - Qwen3 via Ollama picks the post type, pulls out its details, writes the caption
//   - Qwen-Image via ComfyUI paints a picture when the post needs one
//
// All of it runs on the developer's own machine, so this only works while Ollama
// and ComfyUI are running (see docs/LOCAL_AI_SETUP.md). The URLs are not
// secrets — nothing here needs an API key — which is why EXPO_PUBLIC_ is fine.

const OLLAMA_URL = process.env.EXPO_PUBLIC_OLLAMA_URL || 'http://127.0.0.1:11434';
const COMFYUI_URL = process.env.EXPO_PUBLIC_COMFYUI_URL || 'http://127.0.0.1:8188';
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
// Generous: with RAM to spare an image takes ~90s on an 8 GB GPU, but when
// the laptop is short on memory it can take several minutes.
const IMAGE_TIMEOUT_MS = 10 * 60 * 1000;

const NOT_RUNNING_MESSAGE = (name, url) =>
  `Couldn't reach ${name} at ${url}. Make sure it's running on this computer (see docs/LOCAL_AI_SETUP.md).`;

// A busy ComfyUI on a laptop short of memory can miss a request for a few
// seconds, so a failed connection is retried before giving up.
const CONNECT_ATTEMPTS = 4;
const CONNECT_RETRY_MS = 3000;

async function request(name, baseUrl, path, options) {
  let res;
  for (let attempt = 1; !res; attempt += 1) {
    try {
      res = await fetch(`${baseUrl}${path}`, options);
    } catch (error) {
      if (attempt >= CONNECT_ATTEMPTS) throw new Error(NOT_RUNNING_MESSAGE(name, baseUrl));
      await new Promise((resolve) => setTimeout(resolve, CONNECT_RETRY_MS * attempt));
    }
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${name} returned ${res.status}${body ? `: ${body.slice(0, 300)}` : ''}`);
  }
  return res.json();
}

async function ollamaJson({ model, system, user, images, options }) {
  const data = await request('Ollama', OLLAMA_URL, '/api/chat', {
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
    throw new Error(`${model} replied with something that was not valid JSON. Try again.`);
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
      'Reply with JSON only, shaped as {"category": string, "style": string, "headingStyle": string, "palette": [string], ' +
      '"photoStyle": string, "photoSide": string}. ' +
      '"category" is a short name for this kind of post, e.g. "Placement congratulations". ' +
      '"style" is a detailed paragraph an image generator can follow to draw a new design in the same style: ' +
      'background colours and gradients, decorative shapes ' +
      '(waves, ribbons, gold curves, frames) and where they sit, ' +
      'how text is arranged (centred, left-aligned, in pills or banners), spacing and overall feel. ' +
      'Describe the design only — do not mention any names, words, numbers, logos or contact details shown on ' +
      'it, and do not describe its header or footer (the app adds those itself). ' +
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
    '. "imagePrompt" is a vivid one-paragraph description of a photo to go with the post, for an image ' +
    'generator (subject, setting, lighting, composition, style), with no text, words or logos in it.';

  const user = `Request: ${prompt}\n\nUploaded images:\n${describeImages(analyses)}`;

  const parsed = await ollamaJson({ model: CAPTION_MODEL, system, user });

  if (!parsed.caption) {
    throw new Error('Qwen3 did not return a caption. Try again.');
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
async function runComfyWorkflow(workflow, outputNode) {
  const queued = await request('ComfyUI', COMFYUI_URL, '/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });

  const promptId = queued.prompt_id;
  const startedAt = Date.now();

  while (Date.now() - startedAt < IMAGE_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);

    const history = await request('ComfyUI', COMFYUI_URL, `/history/${promptId}`);
    const entry = history[promptId];
    if (!entry) continue;

    if (entry.status?.status_str === 'error') {
      throw new Error('ComfyUI failed while generating the image. Check the ComfyUI window for details.');
    }

    const image = entry.outputs?.[outputNode]?.images?.[0];
    if (image) {
      const query = new URLSearchParams({
        filename: image.filename,
        subfolder: image.subfolder || '',
        type: image.type || 'output',
      });
      return `${COMFYUI_URL}/view?${query.toString()}`;
    }
  }

  throw new Error(
    'Image generation took longer than 10 minutes and was stopped. Close other apps to free up memory and try again.'
  );
}

// size: optional { width, height } (multiples of 16); defaults to the
// platform's post size.
export async function generateImage({ imagePrompt, platform, size }) {
  const { width, height } = size || IMAGE_SIZES[platform] || IMAGE_SIZES.Instagram;
  const seed = Math.floor(Math.random() * 2 ** 32);
  const uri = await runComfyWorkflow(buildImageWorkflow({ imagePrompt, width, height, seed }), '11');
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
  const res = await request('ComfyUI', COMFYUI_URL, '/upload/image', { method: 'POST', body: form });
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

// Reads all the text in an image (Qwen3-VL), to check that newly written
// text says what it should.
export async function readImageText(uri) {
  const blob = await (await fetch(uri)).blob();
  const dataUri = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the redrawn image.'));
    reader.readAsDataURL(blob);
  });

  // Plain text, not JSON: the vision model occasionally breaks JSON, and a
  // check that can't be read should count as "not verified", not crash.
  const data = await request('Ollama', OLLAMA_URL, '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        { role: 'system', content: 'Write out every piece of text visible in the image, exactly as written, and nothing else.' },
        { role: 'user', content: 'Read all the text in this image.', images: [dataUri.slice(dataUri.indexOf(',') + 1)] },
      ],
      think: false,
      stream: false,
      keep_alive: 0,
      options: { temperature: 0, seed: 7 },
    }),
  });
  return String(data.message?.content || '');
}
