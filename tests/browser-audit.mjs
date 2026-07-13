import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = process.cwd();
const HTTP_PORT = 4173;
const DEBUG_PORT = 9225;
const RESULT_DIR = join(ROOT, 'test-results');
mkdirSync(RESULT_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

function chromePath() {
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);
  for (const candidate of candidates) if (existsSync(candidate)) return candidate;
  for (const command of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const found = spawnSync('which', [command], { encoding: 'utf8' }).stdout.trim();
    if (found) return found;
  }
  throw new Error('Chrome or Chromium is required for the browser audit test.');
}

function serve() {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${HTTP_PORT}`).pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = normalize(join(ROOT, relative));
    if (!file.startsWith(ROOT) || !existsSync(file)) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    response.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(HTTP_PORT, '127.0.0.1', () => resolve(server)));
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
    const response = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Browser evaluation failed.');
    return response.result?.value;
  }

  close() {
    this.socket.close();
  }
}

const server = await serve();
const chrome = spawn(chromePath(), [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--window-size=1440,1200',
  '--user-data-dir=/tmp/tad-phase3-browser-profile',
  'about:blank'
], { stdio: 'ignore' });

let cdp;
try {
  await waitForDebugPort();
  const pageResponse = await fetch(
    `http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(`http://127.0.0.1:${HTTP_PORT}/admin-audit-v2.html`)}`,
    { method: 'PUT' }
  );
  assert.equal(pageResponse.ok, true, 'Chrome page target should open');
  const page = await pageResponse.json();
  cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  for (let attempt = 0; attempt < 100; attempt += 1) {
    if ((await cdp.evaluate('document.readyState')) === 'complete') break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  assert.equal(await cdp.evaluate('document.title'), 'Admin Audit — The Admin Department');
  assert.equal(await cdp.evaluate('Boolean(window.AdminAudit)'), true, 'Audit engine should load');

  assert.equal(await cdp.evaluate(`(() => {
    const form = document.querySelector('#admin-audit-form');
    const set = (name, value) => {
      const element = form.elements[name];
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    };
    set('business', 'Phase 3 Browser Test');
    set('contact', 'Test Operator');
    set('email', 'phase3-browser@example.com');
    set('team_size', '6–20 people');
    set('admin_hours', '11–20');
    set('records_per_week', '60');
    set('channels', '3');
    set('outcome', 'Stop property requests and approvals disappearing');
    document.querySelector('.audit-step[data-step="1"] [data-next]').click();
    return !document.querySelector('.audit-step[data-step="2"]').hidden;
  })()`), true, 'Step 1 should advance to Step 2');

  assert.equal(await cdp.evaluate(`(() => {
    const form = document.querySelector('#admin-audit-form');
    const values = { invoice: '1', sales: '1', client: '2', property: '4', practice: '0', member: '0' };
    Object.entries(values).forEach(([name, value]) => {
      form.elements[name].value = value;
      form.elements[name].dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelector('.audit-step[data-step="2"] [data-next]').click();
    return !document.querySelector('.audit-step[data-step="3"]').hidden;
  })()`), true, 'Step 2 should advance to Step 3');

  assert.equal(await cdp.evaluate(`(() => {
    const form = document.querySelector('#admin-audit-form');
    const values = {
      control_capture: '2', control_ownership: '2', control_next_action: '1', control_due_dates: '1',
      control_approvals: '1', control_visibility: '1', control_reporting: '1', control_documented: '2'
    };
    Object.entries(values).forEach(([name, value]) => {
      form.elements[name].value = value;
      form.elements[name].dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelector('.audit-step[data-step="3"] [data-next]').click();
    return !document.querySelector('.audit-step[data-step="4"]').hidden;
  })()`), true, 'Step 3 should advance to Step 4');

  const report = await cdp.evaluate(`(() => {
    const form = document.querySelector('#admin-audit-form');
    ['property_requests', 'approvals_stuck', 'manual_reporting', 'owner_visibility'].forEach((value) => {
      form.querySelector('input[name="signals"][value="' + value + '"]').checked = true;
    });
    ['live_list', 'recent_report'].forEach((value) => {
      form.querySelector('input[name="evidence"][value="' + value + '"]').checked = true;
    });
    form.elements.notes.value = 'Synthetic browser test. No private records.';
    form.requestSubmit();
    const offer = document.querySelector('#email-audit');
    return {
      resultVisible: !document.querySelector('#audit-result').hidden,
      formHidden: form.hidden,
      score: document.querySelector('#audit-score').textContent,
      band: document.querySelector('#audit-band').textContent,
      primary: document.querySelector('#primary-department').textContent,
      rootCauses: document.querySelector('#root-causes').children.length,
      pilotStages: document.querySelector('#pilot-plan').children.length,
      measures: document.querySelector('#success-measures').children.length,
      offerReady: offer.href.includes('/property-admin-service.html?') && offer.textContent.includes('Property Admin offer')
    };
  })()`);

  assert.deepEqual(report, {
    resultVisible: true,
    formHidden: true,
    score: '95/100',
    band: 'Critical admin leakage',
    primary: 'Property Admin',
    rootCauses: 4,
    pilotStages: 4,
    measures: 4,
    offerReady: true
  });

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
  assert.equal(
    await cdp.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'),
    true,
    'Audit report should not overflow horizontally on a mobile viewport'
  );

  const screenshot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true
  });
  writeFileSync(join(RESULT_DIR, 'admin-audit-v2-mobile.png'), Buffer.from(screenshot.data, 'base64'));
  console.log(`Admin Audit v2 browser journey passed: ${JSON.stringify(report)}`);
} finally {
  if (cdp) cdp.close();
  chrome.kill('SIGTERM');
  server.close();
}
