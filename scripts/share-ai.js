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
// Keep this window open while others generate. Ctrl+C stops sharing.
// Needs cloudflared: `winget install Cloudflare.cloudflared`, or the single-file
// cloudflared-windows-amd64.exe saved as %LOCALAPPDATA%\cloudflared\cloudflared.exe.

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

function safeEqual(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '';
  const cors = corsHeaders(origin);
  const [, key = '', service = '', ...rest] = (req.url || '').split('/');
  const upstream = UPSTREAMS[service];

  if (!safeEqual(key, KEY) || !upstream) {
    res.writeHead(404, cors).end();
    return;
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors).end();
    return;
  }

  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (!DROP_REQUEST_HEADERS.has(name) && !name.startsWith('cf-') && !name.startsWith('x-forwarded')) {
      headers[name] = value;
    }
  }
  headers.host = `${upstream.host}:${upstream.port}`;

  const forward = http.request(
    { ...upstream, method: req.method, path: `/${rest.join('/')}`, headers },
    (upstreamRes) => {
      const out = {};
      for (const [name, value] of Object.entries(upstreamRes.headers)) {
        if (!name.startsWith('access-control-') && name !== 'connection' && name !== 'keep-alive') out[name] = value;
      }
      res.writeHead(upstreamRes.statusCode || 502, { ...out, ...cors });
      upstreamRes.pipe(res);
    }
  );
  forward.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(502, { ...cors, 'Content-Type': 'text/plain' });
    }
    res.end(`${service === 'ollama' ? 'Ollama' : 'ComfyUI'} is not running on the sharing laptop.`);
  });
  req.pipe(forward);

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
  await checkLocal('ComfyUI', 'http://127.0.0.1:8188/system_stats');

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
    const link = `${SITE}/?ai=${encodeURIComponent(server)}`;
    console.log('\n================ SHARING IS ON ================');
    console.log('Send this link to your teammates (open it once, then use the site as normal):\n');
    console.log(`  ${link}\n`);
    console.log('It works only while this window stays open and the laptop is awake.');
    console.log('Each run makes a new link; the old one stops working.');
    console.log('To use their own computer again, they open:  ' + `${SITE}/?ai=local`);
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
