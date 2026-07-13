import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const PORT = 4173;
const DEBUG_PORT = 9226;
const BASE = `http://127.0.0.1:${PORT}`;
const CLIENT_PORTAL = 'https://due-today-six.vercel.app/portal';
const ADMIN_HQ = 'https://due-today-six.vercel.app/hq';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function chromePath() {
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const candidate of candidates) if (existsSync(candidate)) return candidate;
  for (const command of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const found = spawnSync('which', [command], { encoding: 'utf8' }).stdout.trim();
    if (found) return found;
  }
  throw new Error('Chrome or Chromium is required.');
}

function serve() {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, BASE).pathname);
    let relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    if (relative.endsWith('/')) relative += 'index.html';
    const file = normalize(join(ROOT, relative));
    if (!file.startsWith(ROOT) || !existsSync(file)) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    response.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

async function waitForDebugPort() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Chrome DevTools endpoint did not start.');
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.sequence = 0;
    this.pending = new Map();
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
      else pending.resolve(message.result || {});
    });
  }
  async open() {
    if (this.socket.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
  }
  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const response = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Browser evaluation failed.');
    return response.result?.value;
  }
  close() { this.socket.close(); }
}

const sixOffers = [
  ['Invoice Admin', 'invoice-admin-service.html'],
  ['Sales Admin', 'sales-admin-service.html'],
  ['Client Admin', 'client-admin-service.html'],
  ['Property Admin', 'property-admin-service.html'],
  ['Practice / Booking Admin', 'practice-admin-service.html'],
  ['Member Admin', 'member-admin-service.html'],
];

const server = await serve();
const chrome = spawn(chromePath(), [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
  '--remote-allow-origins=*', `--remote-debugging-port=${DEBUG_PORT}`,
  '--window-size=390,844', '--user-data-dir=/tmp/tad-live-entry-profile', 'about:blank',
], { stdio: 'ignore' });

let cdp;
try {
  await waitForDebugPort();
  const target = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(BASE)}`, { method: 'PUT' });
  assert.equal(target.ok, true);
  const page = await target.json();
  cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  for (let attempt = 0; attempt < 100; attempt += 1) {
    if ((await cdp.evaluate('document.readyState')) === 'complete') break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  assert.match(await cdp.evaluate('document.title'), /The Admin Department/i);
  assert.equal(await cdp.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);

  const links = await cdp.evaluate(`Array.from(document.querySelectorAll('a')).map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }))`);
  assert.ok(links.some((link) => link.text === 'Client Portal' && link.href === 'portal/'));
  assert.ok(links.some((link) => link.text === 'Admin HQ' && link.href === 'ops/'));

  for (const [name, path] of sixOffers) {
    const response = await fetch(`${BASE}/${path}`);
    assert.equal(response.status, 200, `${name} offer must load`);
    const body = await response.text();
    assert.match(body, new RegExp(name.replace('/', '\\/'), 'i'));
    assert.match(body, /apply|application|start/i, `${name} must expose a real next step`);
  }

  for (const path of ['admin-audit.html', 'portal/', 'ops/']) {
    const response = await fetch(`${BASE}/${path}`);
    assert.equal(response.status, 200, `${path} must load`);
  }

  const portalHtml = await (await fetch(`${BASE}/portal/`)).text();
  const hqHtml = await (await fetch(`${BASE}/ops/`)).text();
  assert.ok(portalHtml.includes(CLIENT_PORTAL), 'TAD Client Portal must hand off to the branded client route');
  assert.ok(hqHtml.includes(ADMIN_HQ), 'TAD Admin HQ must hand off to the branded operator route');

  for (const [name, url] of [['Client Portal', CLIENT_PORTAL], ['Admin HQ', ADMIN_HQ]]) {
    const response = await fetch(url, { redirect: 'manual' });
    assert.ok([200, 301, 302, 303, 307, 308].includes(response.status), `${name} endpoint must be reachable`);
  }

  console.log(JSON.stringify({
    result: 'passed',
    offers: sixOffers.length,
    clientPortal: CLIENT_PORTAL,
    adminHQ: ADMIN_HQ,
    mobileOverflow: false,
  }));
} finally {
  if (cdp) cdp.close();
  chrome.kill('SIGTERM');
  server.close();
}
