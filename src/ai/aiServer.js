// Where the app finds Ollama and ComfyUI.
//
// By default that's this computer (127.0.0.1), which only works on the laptop
// that runs them. The laptop's owner can share them with teammates by running
// `npm run share-ai`: it prints a link like
//   https://social-lift-app.vercel.app/?ai=https://<name>.trycloudflare.com/<key>
// Opening that link once stores the shared server in this browser, and every
// later request goes there instead. `?ai=local` switches back.

const STORAGE_KEY = 'sociallift.aiServer';

const LOCAL_OLLAMA_URL = process.env.EXPO_PUBLIC_OLLAMA_URL || 'http://127.0.0.1:11434';
const LOCAL_COMFYUI_URL = process.env.EXPO_PUBLIC_COMFYUI_URL || 'http://127.0.0.1:8188';

function storage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function sharedServer() {
  try {
    return storage()?.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

// Only https links are accepted, so a mistyped or tampered link can't point
// the app at some random http address.
function cleanLink(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return '';
    return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

// Called once when the app starts (web only): saves ?ai=... and removes it
// from the address bar so it isn't left in history or shared screenshots.
export function captureAiServerFromUrl() {
  if (typeof window === 'undefined' || !window.location) return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('ai')) return;

  const value = params.get('ai') || '';
  try {
    if (value === 'local') {
      storage()?.removeItem(STORAGE_KEY);
    } else {
      const link = cleanLink(value);
      if (link) storage()?.setItem(STORAGE_KEY, link);
    }
  } catch {
    // storage blocked (private window): the app falls back to this computer
  }

  params.delete('ai');
  const query = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
}

export function aiServer() {
  const shared = sharedServer();
  if (shared) {
    return { ollama: `${shared}/ollama`, comfyui: `${shared}/comfy`, shared: true };
  }
  return { ollama: LOCAL_OLLAMA_URL, comfyui: LOCAL_COMFYUI_URL, shared: false };
}
