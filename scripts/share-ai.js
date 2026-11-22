#!/usr/bin/env node
// Shares this laptop's Ollama and ComfyUI with teammates through the internet,
// so they can generate posts on the live site without their own GPU.
//
//   npm run share-ai
//
// 1. Starts a small proxy on 127.0.0.1:8790 that forwards
//      /<key>/ollama/...  -> Ollama  (127.0.0.1:11434)
//      /<key>/comfy/...   -> ComfyUI (127.0.0.1:8188)
//    and refuses everything else. <key> is random and new on every run, so a
//    link stops working as soon as you stop sharing.
// 2. Opens a free Cloudflare quick tunnel to that proxy (no account needed).
// 3. Prints the link to send to teammates. Opening it once in their browser
//    points the app at your laptop (see src/ai/aiServer.js).
//
// Instagram (optional): with IG_USER_ID, IG_ACCESS_TOKEN and
// SHARE_AI_INSTAGRAM_UIDS in .env.local (git-ignored), the signed-in accounts
// listed there can publish a finished post from the app:
//      GET  /<key>/instagram/status    -> { enabled, username }
//      POST /<key>/instagram/publish   (Firebase ID token in Authorization)
//      GET  /<key>/media/<id>.jpg      the poster, for Instagram to fetch
// The token never leaves this laptop.
//
// Keep this window open while others generate. Ctrl+C stops sharing.
// Needs cloudflared: `winget install Cloudflare.cloudflared`, or the single-file
// cloudflared-windows-amd64.exe saved as %LOCALAPPDATA%\cloudflared\cloudflared.exe.

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

// .env.local holds this laptop's own secrets (Instagram token); values
// already set in the environment win.
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnvFile(path.join(__dirname, '..', '.env.local'));

const PROXY_PORT = Number(process.env.SHARE_AI_PORT || 8790);
const SITE = process.env.SHARE_AI_SITE || 'https://social-lift-app.vercel.app';
const ALLOWED_ORIGINS = new Set([SITE, 'http://localhost:8081']);
const UPSTREAMS = {
  ollama: { host: '127.0.0.1', port: 11434 },
  comfy: { host: '127.0.0.1', port: 8188 },
};
const KEY = crypto.randomBytes(18).toString('base64url');

// Headers that must not be passed on: hop-by-hop ones, and Origin/Referer,
// which would make Ollama and ComfyUI treat the request as cross-site.
const DROP_REQUEST_HEADERS = new Set([
  'host', 'origin', 'referer', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade',
  'proxy-connection', 'te', 'trailer',
]);

function corsHeaders(origin) {
  if (!ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

function safeEqual(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// =========================
// INSTAGRAM
// =========================

const IG = {
  userId: process.env.IG_USER_ID || '',
  token: process.env.IG_ACCESS_TOKEN || '',
  uids: new Set((process.env.SHARE_AI_INSTAGRAM_UIDS || '').split(',').map((s) => s.trim()).filter(Boolean)),
  project: process.env.FIREBASE_PROJECT_ID || 'social-lift-2',
  username: '',
};
const GRAPH = 'https://graph.facebook.com/v21.0';
// This proxy's public address (tunnel URL + key), set once the tunnel is up:
// Instagram fetches the poster from it.
let publicBase = '';
// Posters waiting for Instagram to fetch them, kept for an hour.
const media = new Map();
const MEDIA_TTL_MS = 60 * 60 * 1000;
const MAX_BODY_BYTES = 20 * 1024 * 1024;

async function graph(pathAndQuery, form) {
  const res = await fetch(`${GRAPH}/${pathAndQuery}`, form
    ? { method: 'POST', body: new URLSearchParams({ ...form, access_token: IG.token }) }
    : undefined);
  const data = await res.json();
  if (data.error) throw new Error(data.error.error_user_msg || data.error.message || 'Instagram refused the request');
  return data;
}

async function checkInstagram() {
  if (!IG.userId || !IG.token || !IG.uids.size) return;
  try {
    const me = await graph(`${IG.userId}?fields=username&access_token=${encodeURIComponent(IG.token)}`);
    IG.username = me.username;
  } catch (error) {
    console.warn(`  ! Instagram token not working: ${error.message}`);
  }
}

// Firebase ID tokens are RS256 JWTs signed with Google's keys; checked here
// with no extra packages. Returns the account's uid, or throws.
let googleCerts = { at: 0, certs: {} };
async function verifyFirebaseToken(token) {
  const [h, p, s] = String(token || '').split('.');
  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(h, 'base64url').toString());
    payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  } catch {
    throw new Error('Sign in again and retry.');
  }
  if (Date.now() - googleCerts.at > 60 * 60 * 1000 || !googleCerts.certs[header.kid]) {
    const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    googleCerts = { at: Date.now(), certs: await res.json() };
  }
  const cert = googleCerts.certs[header.kid];
  const now = Date.now() / 1000;
  const valid =
    header.alg === 'RS256' &&
    cert &&
    crypto.createVerify('RSA-SHA256').update(`${h}.${p}`).verify(cert, Buffer.from(s, 'base64url')) &&
    payload.aud === IG.project &&
    payload.iss === `https://securetoken.google.com/${IG.project}` &&
    payload.exp > now &&
    payload.iat < now + 300 &&
    payload.sub;
  if (!valid) throw new Error('Sign in again and retry.');
  return payload.sub;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('The poster is too large.'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function publishToInstagram(req) {
  const uid = await verifyFirebaseToken((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  if (!IG.uids.has(uid)) throw new Error('This account is not allowed to post to Instagram.');
  // dryRun: everything up to the post being ready, without publishing it
  // (for testing; an unpublished container expires after 24 hours).
  const { image, caption, dryRun } = JSON.parse(await readBody(req));
  const m = /^data:image\/jpeg;base64,(.+)$/.exec(image || '');
  if (!m) throw new Error('The poster must be a JPEG.');

  const id = crypto.randomBytes(12).toString('hex');
  media.set(id, { jpeg: Buffer.from(m[1], 'base64'), at: Date.now() });
  const imageUrl = `${publicBase}/media/${id}.jpg`;

  // Instagram fetches the image, processes it, then it can be published.
  const container = await graph(`${IG.userId}/media`, { image_url: imageUrl, caption: String(caption || '').slice(0, 2200) });
  for (let i = 0; i < 30; i += 1) {
    const { status_code: status } = await graph(`${container.id}?fields=status_code&access_token=${encodeURIComponent(IG.token)}`);
    if (status === 'FINISHED') break;
    if (status === 'ERROR' || status === 'EXPIRED') throw new Error('Instagram could not process the image.');
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (dryRun) return { ready: true, container: container.id };
  const post = await graph(`${IG.userId}/media_publish`, { creation_id: container.id });
  const { permalink } = await graph(`${post.id}?fields=permalink&access_token=${encodeURIComponent(IG.token)}`);
  return { url: permalink };
}

async function handleInstagram(req, res, cors, action) {
  const send = (status, body) =>
    res.writeHead(status, { ...cors, 'Content-Type': 'application/json' }).end(JSON.stringify(body));
  const enabled = Boolean(IG.username && publicBase);
  if (action === 'status') return send(200, { enabled, username: IG.username });
  if (action !== 'publish' || req.method !== 'POST') return send(404, { error: 'Not found' });
  if (!enabled) return send(503, { error: 'Instagram posting is not set up on the sharing laptop.' });
  try {
    const result = await publishToInstagram(req);
    console.log(`[${new Date().toLocaleTimeString()}] ${result.url ? `posted to Instagram: ${result.url}` : 'Instagram test: post ready, not published'}`);
    return send(200, result);
  } catch (error) {
    console.warn(`[${new Date().toLocaleTimeString()}] Instagram post failed: ${error.message}`);
    return send(400, { error: error.message });
  }
}

function serveMedia(res, file) {
  for (const [id, item] of media) if (Date.now() - item.at > MEDIA_TTL_MS) media.delete(id);
  const item = media.get(String(file).replace(/\.jpg$/, ''));
  if (!item) return res.writeHead(404).end();
  return res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': item.jpeg.length }).end(item.jpeg);
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '';
  const cors = corsHeaders(origin);
  const [pathPart, query] = (req.url || '').split(/\?(.*)/s);
  const [, key = '', service = '', ...rest] = pathPart.split('/');
  const upstream = UPSTREAMS[service];
  const local = service === 'instagram' || service === 'media';

  if (!safeEqual(key, KEY) || (!upstream && !local)) {
    res.writeHead(404, cors).end();
    return;
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors).end();
    return;
  }
  if (service === 'media') return serveMedia(res, rest[0]);
  if (service === 'instagram') return handleInstagram(req, res, cors, rest[0]);

  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (!DROP_REQUEST_HEADERS.has(name) && !name.startsWith('cf-') && !name.startsWith('x-forwarded')) {
      headers[name] = value;
    }
  }
  headers.host = `${upstream.host}:${upstream.port}`;

  // Cloudflare drops a request that gets no reply within 100 s, and a Qwen3
  // answer can take longer when the GPU is busy. So for Ollama calls the
  // reply starts at once and a space is sent every 15 s until the answer
  // arrives (JSON allows leading spaces); an Ollama error then comes through
  // as {"error": ...} with status 200, which the app checks for.
  const keepAlive = service === 'ollama' && req.method === 'POST';
  let ticker = null;
  if (keepAlive) {
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.write(' ');
    ticker = setInterval(() => res.write(' '), 15000);
  }

  const forward = http.request(
    { ...upstream, method: req.method, path: `/${rest.join('/')}${query ? `?${query}` : ''}`, headers },
    (upstreamRes) => {
      clearInterval(ticker);
      if (!keepAlive) {
        const out = {};
        for (const [name, value] of Object.entries(upstreamRes.headers)) {
          if (!name.startsWith('access-control-') && name !== 'connection' && name !== 'keep-alive') out[name] = value;
        }
        res.writeHead(upstreamRes.statusCode || 502, { ...out, ...cors });
      }
      upstreamRes.pipe(res);
    }
  );
  forward.on('error', () => {
    clearInterval(ticker);
    const message = `${service === 'ollama' ? 'Ollama' : 'ComfyUI'} is not running on the sharing laptop.`;
    if (keepAlive) return res.end(JSON.stringify({ error: message }));
    if (!res.headersSent) res.writeHead(502, { ...cors, 'Content-Type': 'text/plain' });
    return res.end(message);
  });
  // The browser went away before the answer (tab closed, connection cut):
  // stop the work instead of leaving it to hold the GPU for nobody.
  res.on('close', () => {
    clearInterval(ticker);
    if (!res.writableEnded) forward.destroy();
  });
  req.pipe(forward);
  lastAiActivity = Date.now();

  const time = new Date().toLocaleTimeString();
  if (req.method === 'POST' && /\/(prompt|api\/chat)$/.test(req.url)) {
    console.log(`[${time}] ${service === 'comfy' ? 'image requested' : 'text/vision request'}`);
  }
});

function findCloudflared() {
  const candidates = [
    process.env.CLOUDFLARED,
    path.join(process.env.LOCALAPPDATA || '', 'cloudflared', 'cloudflared.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'cloudflared.exe'),
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
    'C:\\Program Files\\cloudflared\\cloudflared.exe',
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (found) return found;
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['cloudflared'], { encoding: 'utf8' });
  return which.status === 0 ? which.stdout.split(/\r?\n/)[0].trim() : null;
}

// =========================
// COMFYUI WATCHDOG
// ComfyUI's memory grows with every image (it reached 30 GB on this 16 GB
// laptop after ~20 images), and then Windows pages to disk and each image
// takes 8-10 minutes instead of ~2. If ComfyUI isn't already running, it is
// started here with the right flags, and restarted (about 20 s) whenever it
// is idle and has grown past COMFY_MEMORY_LIMIT_GB.
// =========================

const COMFY_DIR = process.env.COMFYUI_DIR || path.join(os.homedir(), 'ComfyUI');
const COMFY_MEMORY_LIMIT_GB = Number(process.env.COMFY_MEMORY_LIMIT_GB || 10);
const IDLE_BEFORE_RESTART_MS = 3 * 60 * 1000;
let lastAiActivity = 0;
let comfyChild = null;
let restarting = false;

function startComfy() {
  const log = fs.openSync(path.join(COMFY_DIR, 'user', 'sociallift-comfyui.log'), 'a');
  comfyChild = spawn(
    path.join(COMFY_DIR, 'venv', 'Scripts', 'python.exe'),
    ['main.py', '--lowvram', '--fast-disk', '--disable-pinned-memory', '--listen', '127.0.0.1', '--enable-cors-header', SITE],
    { cwd: COMFY_DIR, stdio: ['ignore', log, log], windowsHide: true }
  );
  comfyChild.on('exit', () => {
    comfyChild = null;
  });
}

async function waitForComfy(timeoutMs = 180000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      if ((await fetch('http://127.0.0.1:8188/system_stats')).ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

// Private memory (GB) of every ComfyUI process (the venv launcher starts the
// real python as a child, so both are counted).
function comfyMemoryGb() {
  const ps = spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      "(Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { $_.CommandLine -match 'main\\.py' -and $_.CommandLine -match '--fast-disk' } | Measure-Object PrivatePageCount -Sum).Sum",
    ],
    { encoding: 'utf8' }
  );
  return Number(ps.stdout.trim() || 0) / 1024 ** 3;
}

// Newest file ComfyUI saved (output) or was sent (input): its last job, even
// one from a browser talking to ComfyUI directly rather than through here.
function lastComfyFileTime() {
  let newest = 0;
  for (const dir of ['output', 'input']) {
    try {
      for (const name of fs.readdirSync(path.join(COMFY_DIR, dir))) {
        newest = Math.max(newest, fs.statSync(path.join(COMFY_DIR, dir, name)).mtimeMs);
      }
    } catch {
      // folder missing
    }
  }
  return newest;
}

// Idle = nothing queued or loaded now, and no job or request for a while:
// a post keeps using an image for a few minutes after ComfyUI makes it.
let lastBusySeen = 0;
async function aiIdle() {
  try {
    const queue = await (await fetch('http://127.0.0.1:8188/queue')).json();
    const ps = await (await fetch('http://127.0.0.1:11434/api/ps')).json();
    if (queue.queue_running.length + queue.queue_pending.length || (ps.models || []).length) {
      lastBusySeen = Date.now();
      return false;
    }
  } catch {
    return false;
  }
  const lastActivity = Math.max(lastAiActivity, lastBusySeen, lastComfyFileTime());
  return Date.now() - lastActivity > IDLE_BEFORE_RESTART_MS;
}

async function watchComfy() {
  if (restarting || process.platform !== 'win32') return;
  const gb = comfyMemoryGb();
  if (gb < COMFY_MEMORY_LIMIT_GB) return;
  if (!comfyChild) {
    console.warn(`  ! ComfyUI is using ${gb.toFixed(0)} GB and will be slow. Close it; share-ai then starts and looks after it.`);
    return;
  }
  if (!(await aiIdle())) return;
  restarting = true;
  console.log(`[${new Date().toLocaleTimeString()}] ComfyUI grew to ${gb.toFixed(0)} GB — restarting it to keep images fast...`);
  spawnSync('taskkill', ['/PID', String(comfyChild.pid), '/T', '/F']);
  startComfy();
  const ok = await waitForComfy();
  console.log(`[${new Date().toLocaleTimeString()}] ComfyUI ${ok ? 'restarted' : 'did not come back — check the log in ComfyUI/user/sociallift-comfyui.log'}`);
  restarting = false;
}

async function checkLocal(name, url) {
  try {
    await fetch(url);
    return true;
  } catch {
    console.warn(`  ! ${name} is not running at ${url}. Start it before teammates generate.`);
    return false;
  }
}

async function main() {
  const cloudflared = findCloudflared();
  if (!cloudflared) {
    console.error('cloudflared was not found. Install it with:  winget install Cloudflare.cloudflared');
    process.exit(1);
  }

  console.log('Checking the local AI servers...');
  await checkLocal('Ollama', 'http://127.0.0.1:11434/api/tags');
  let comfyRunning = false;
  try {
    comfyRunning = (await fetch('http://127.0.0.1:8188/system_stats')).ok;
  } catch {
    // not running
  }
  if (!comfyRunning && fs.existsSync(path.join(COMFY_DIR, 'main.py'))) {
    console.log('Starting ComfyUI (about 20 s; its log is in ComfyUI/user/sociallift-comfyui.log)...');
    startComfy();
    if (!(await waitForComfy())) console.warn('  ! ComfyUI did not start. Check its log.');
  } else if (!comfyRunning) {
    await checkLocal('ComfyUI', 'http://127.0.0.1:8188/system_stats');
  } else {
    console.log('ComfyUI is already running (started elsewhere): memory is watched, but it can only be restarted by you.');
  }
  setInterval(() => watchComfy().catch(() => {}), 20 * 1000);
  await checkInstagram();

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PROXY_PORT, '127.0.0.1', resolve);
  });

  console.log('Opening the Cloudflare tunnel (takes ~10 seconds)...');
  const tunnel = spawn(cloudflared, ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${PROXY_PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let announced = false;
  const onOutput = (chunk) => {
    const match = !announced && String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (!match) return;
    announced = true;
    const server = `${match[0]}/${KEY}`;
    publicBase = server;
    const link = `${SITE}/?ai=${encodeURIComponent(server)}`;
    console.log('\n================ SHARING IS ON ================');
    console.log('Send this link to your teammates (open it once, then use the site as normal):\n');
    console.log(`  ${link}\n`);
    console.log('It works only while this window stays open and the laptop is awake.');
    console.log('Each run makes a new link; the old one stops working.');
    console.log('To use their own computer again, they open:  ' + `${SITE}/?ai=local`);
    console.log(
      IG.username
        ? `Instagram posting: ON, to @${IG.username}, for ${IG.uids.size} allowed account(s).`
        : 'Instagram posting: off (no working IG_* settings in .env.local).'
    );
    console.log('================================================\n');
    if (process.platform === 'win32') {
      spawnSync('clip', { input: link });
      console.log('(The link is also copied to your clipboard.)\n');
    }
  };
  tunnel.stdout.on('data', onOutput);
  tunnel.stderr.on('data', onOutput);
  tunnel.on('exit', (code) => {
    console.error(`The Cloudflare tunnel stopped (exit code ${code}). Sharing is off; run npm run share-ai again.`);
    server.close();
    process.exit(1);
  });

  const stop = () => {
    console.log('\nStopping sharing...');
    if (comfyChild) spawnSync('taskkill', ['/PID', String(comfyChild.pid), '/T', '/F']);
    tunnel.kill();
    server.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
