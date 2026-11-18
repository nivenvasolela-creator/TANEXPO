// Runs the TANEXPO demo on this computer, with the demo settings switched on.
//
//   npm run demo           -> http://localhost:3000 on this computer
//   npm run demo:public    -> also opens a public https://....trycloudflare.com link
//                             (needs cloudflared installed; see docs/LAUNCH.md)
//
// Settings live in .env.demo next to package.json (created on first run, never committed).
// The database is kept in .data/demo-pg, so operators and leads survive a restart.
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env.demo');
const serverFile = path.join(root, 'dist', 'server.cjs');
const wantTunnel = process.argv.includes('--public');

// Newest modification time of any source file the build depends on.
function newestSource() {
  let newest = 0;
  const walk = (p) => {
    let st;
    try {
      st = fs.statSync(p);
    } catch {
      return;
    }
    if (st.isDirectory()) {
      for (const name of fs.readdirSync(p)) walk(path.join(p, name));
    } else if (st.mtimeMs > newest) newest = st.mtimeMs;
  };
  for (const p of ['src', 'server', 'public', 'server.ts', 'index.html', 'package.json', 'vite.config.ts']) walk(path.join(root, p));
  return newest;
}

// Rebuild when there is no build yet, or the code changed since the last one (e.g. after git pull).
// Without this, the demo silently serves an old version of the app.
const builtAt = fs.existsSync(serverFile) ? fs.statSync(serverFile).mtimeMs : 0;
if (!builtAt || newestSource() > builtAt) {
  console.log(builtAt ? '\nThe code changed since the last build. Rebuilding (about a minute)...\n' : '\nBuilding the app (about a minute)...\n');
  const r = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0 || !fs.existsSync(serverFile)) {
    console.error('\nThe build failed. Run  npm ci  and then  npm run demo  again.');
    process.exit(1);
  }
}

if (!fs.existsSync(envFile)) {
  const password = crypto.randomBytes(9).toString('base64url');
  fs.writeFileSync(
    envFile,
    [
      '# TANEXPO local demo settings. Not committed to git.',
      '# Admin login (needed to verify operators). Change it if you like, then restart.',
      'ADMIN_SEED_EMAIL=admin@tanexpo.local',
      `ADMIN_SEED_PASSWORD=${password}`,
      '# Optional: lets forwarded WhatsApp messages be read by Gemini instead of the keyword parser',
      'GEMINI_API_KEY=',
      ''
    ].join('\n')
  );
  console.log('\nCreated .env.demo with your admin login:');
  console.log('  email:    admin@tanexpo.local');
  console.log(`  password: ${password}`);
  console.log('(It is saved in .env.demo. Change it there any time.)\n');
}

const fileEnv = {};
for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && m[2] !== '') fileEnv[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const port = fileEnv.PORT || process.env.PORT || '3000';
const env = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: port,
  PG_DATA_DIR: path.join(root, '.data', 'demo-pg'),
  PAYMENTS_MODE: 'simulated',
  SEED_DEMO_CATALOG: 'true',
  ALLOW_WHATSAPP_SIMULATOR: 'true',
  WHATSAPP_ENABLED: 'false',
  ...fileEnv
};

const server = spawn(process.execPath, [serverFile], { cwd: root, env, stdio: ['ignore', 'pipe', 'inherit'] });
let tunnel = null;

server.stdout.on('data', (chunk) => {
  const text = String(chunk);
  // Request logs are noisy; show only startup lines and warnings.
  for (const line of text.split('\n')) {
    if (line && !line.startsWith('{"timestamp"') && !line.startsWith('TANEXPO server running')) console.log(line);
  }
  if (text.includes('TANEXPO server running')) {
    console.log(`\nOpen on this computer:  http://localhost:${port}`);
    console.log('(Use exactly that address. Do not use 0.0.0.0.)');
    if (wantTunnel && !tunnel) startTunnel();
    else if (!wantTunnel) console.log('For a link you can open on a phone anywhere, stop this and run:  npm run demo:public\n');
  }
});

function startTunnel() {
  console.log('Starting a public link through Cloudflare...');
  tunnel = spawn('cloudflared', ['tunnel', '--no-autoupdate', '--url', `http://localhost:${port}`], {
    stdio: ['ignore', 'ignore', 'pipe']
  });
  tunnel.on('error', () => {
    console.error('\ncloudflared is not installed, so there is no public link. The demo still runs on this computer.');
    console.error('Install it (see docs/LAUNCH.md, step "Free demo from your laptop"), then run:  npm run demo:public\n');
    tunnel = null;
  });
  let shown = false;
  setTimeout(() => {
    if (!shown && tunnel) {
      console.log('\nNo public link after 45 seconds. Cloudflare may be slow or blocked on this network.');
      console.log('The demo still works on this computer. Stop it (Ctrl+C) and run npm run demo:public again to retry.\n');
    }
  }, 45000).unref();
  tunnel.stderr.on('data', (chunk) => {
    const m = String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (m && !shown) {
      shown = true;
      console.log('\n==============================================================');
      console.log(`  Public link (open on any phone):  ${m[0]}`);
      console.log('  It works while this window stays open and this computer is online.');
      console.log('  The link changes every time you restart.');
      console.log('==============================================================\n');
    }
  });
}

const stop = () => {
  if (tunnel) tunnel.kill();
  server.kill();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
server.on('exit', (code) => {
  if (tunnel) tunnel.kill();
  process.exit(code ?? 0);
});
