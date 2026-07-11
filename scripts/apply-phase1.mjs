import { readFileSync, writeFileSync, rmSync } from "node:fs";

const CONTACT = "mailto:buttercoder.dev@gmail.com?subject=Admin%20Audit%20Request";

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, content) {
  writeFileSync(path, content.endsWith("\n") ? content : `${content}\n`);
}

function replaceOnce(content, search, replacement, label) {
  if (!content.includes(search)) throw new Error(`Patch target not found: ${label}`);
  return content.replace(search, replacement);
}

// ------------------------------------------------------- dynamic production date
let engine = read("app/assets/engine.js");
engine = replaceOnce(
  engine,
  "  var TODAY = '2026-07-10';",
`  function localIsoDate(date) {
    date = date || new Date();
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  var TODAY = localIsoDate(new Date());`,
  "hard-coded date"
);
write("app/assets/engine.js", engine);

// Keep fixtures deterministic while proving the runtime date is dynamic.
let tests = read("tests/run-tests.mjs");
tests = replaceOnce(
  tests,
  "const E = context.AdminEngine;",
`const E = context.AdminEngine;
const FIXTURE_TODAY = '2026-07-10';
const now = new Date();
const currentLocalDate = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0')
].join('-');
assert.equal(E.TODAY, currentLocalDate, 'runtime TODAY must follow the current local calendar date');`,
  "test date fixture"
);
tests = tests.replaceAll("E.validate(system, r, records)", "E.validate(system, r, records, FIXTURE_TODAY)");
tests = tests.replaceAll("E.report(system, records)", "E.report(system, records, FIXTURE_TODAY)");
tests = tests.replaceAll("E.validate(system, r, productionRecords)", "E.validate(system, r, productionRecords, FIXTURE_TODAY)");
tests = tests.replaceAll("E.report(system, productionRecords)", "E.report(system, productionRecords, FIXTURE_TODAY)");
if (!tests.includes("runtime TODAY must follow")) throw new Error("Dynamic date assertion was not added");
write("tests/run-tests.mjs", tests);

// ------------------------------------------------------- browser-only safety boundary
let app = read("app/assets/app.js");
app = replaceOnce(
  app,
`  var system = document.body.dataset.system || 'invoice';
  var config = E.systems[system];
  var records = load();`,
`  var system = document.body.dataset.system || 'invoice';
  var config = E.systems[system];
  var sensitiveSystemLocked = system === 'practice';
  var records = load();
  if (sensitiveSystemLocked) {
    localStorage.removeItem(config.storageKey);
    records = [];
  }`,
  "practice safety lock"
);
app = replaceOnce(
  app,
`  function ensureEnhancements() {
    if (!$('toolbar')) {`,
`  function ensureEnhancements() {
    if (!$('data-safety-notice')) {
      var notice = document.createElement('div');
      notice.id = 'data-safety-notice';
      notice.setAttribute('role', 'note');
      notice.style.cssText = 'margin:0 0 18px;padding:14px 16px;border:1px solid #b56b00;background:#fff8e8;color:#4a3212;font-size:13px;line-height:1.5';
      notice.innerHTML = sensitiveSystemLocked
        ? '<strong>Public demonstration only.</strong> Patient or health information is not accepted here. Adding, editing and importing records is disabled. Use sample data only.'
        : '<strong>Browser-only pilot.</strong> Do not enter identity numbers, banking details, medical information, passwords or other sensitive data. Records stay only in this browser and may be lost.';
      var head = document.querySelector('.app-head');
      if (head) head.before(notice);
    }
    if (!$('toolbar')) {`,
  "safety notice"
);
app = replaceOnce(
  app,
`  function render() {`,
`  function bindEditButtons(selector) {
    document.querySelectorAll(selector).forEach(function (b) {
      if (sensitiveSystemLocked) {
        b.disabled = true;
        b.textContent = 'Demo only';
        b.setAttribute('aria-disabled', 'true');
      } else {
        b.addEventListener('click', function () { openForm(Number(b.dataset.edit)); });
      }
    });
  }

  function render() {`,
  "safe edit binder"
);
app = replaceOnce(
  app,
`    document.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { openForm(Number(b.dataset.edit)); }); });`,
`    bindEditButtons('[data-edit]');`,
  "table edit binding"
);
app = replaceOnce(
  app,
`    document.querySelectorAll('#record-cards [data-edit]').forEach(function (b) { b.addEventListener('click', function () { openForm(Number(b.dataset.edit)); }); });`,
`    bindEditButtons('#record-cards [data-edit]');`,
  "card edit binding"
);
app = replaceOnce(
  app,
`  function openForm(index) {
    editingIndex = typeof index === 'number' ? index : null;`,
`  function openForm(index) {
    if (sensitiveSystemLocked) {
      toast('Practice Admin is demo-only. Do not enter patient data.');
      return;
    }
    editingIndex = typeof index === 'number' ? index : null;`,
  "open form guard"
);
app = replaceOnce(
  app,
`  $('add-record').addEventListener('click', function () { openForm(); });`,
`  $('add-record').addEventListener('click', function () {
    if (sensitiveSystemLocked) return toast('Practice Admin is demo-only.');
    openForm();
  });`,
  "add record guard"
);
app = replaceOnce(
  app,
`  $('import-csv').addEventListener('change', function (e) { var file = e.target.files[0]; if (!file) return; file.text().then(function (text) { records = E.parseCSV(text); save(); render(); toast('CSV imported'); }); });`,
`  $('import-csv').addEventListener('change', function (e) {
    if (sensitiveSystemLocked) {
      e.target.value = '';
      return toast('Practice Admin import is disabled in the public demo.');
    }
    var file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      e.target.value = '';
      return toast('CSV is too large. Maximum size is 2 MB.');
    }
    file.text().then(function (text) {
      records = E.parseCSV(text);
      save();
      render();
      toast('CSV imported');
    }).catch(function () { toast('CSV could not be read'); });
  });`,
  "CSV safety guard"
);
app = replaceOnce(
  app,
`  $('record-form').addEventListener('submit', function (e) { e.preventDefault(); var r = formRecord(); if (editingIndex === null) records.unshift(r); else records[editingIndex] = r; save(); $('record-modal').close(); render(); toast(editingIndex === null ? 'Record added' : 'Record updated'); });`,
`  $('record-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (sensitiveSystemLocked) {
      $('record-modal').close();
      return toast('Practice Admin is demo-only.');
    }
    var r = formRecord();
    if (editingIndex === null) records.unshift(r); else records[editingIndex] = r;
    save();
    $('record-modal').close();
    render();
    toast(editingIndex === null ? 'Record added' : 'Record updated');
  });`,
  "form submit guard"
);
app = replaceOnce(
  app,
`  if (new URLSearchParams(location.search).get('demo') === '1' && !records.length) { records = E.sampleRecords(system); save(); }
  render();`,
`  if (sensitiveSystemLocked) {
    $('add-record').disabled = true;
    $('import-csv').disabled = true;
  }
  if (new URLSearchParams(location.search).get('demo') === '1' && !records.length) {
    records = E.sampleRecords(system);
    if (!sensitiveSystemLocked) save();
  }
  render();`,
  "demo initialization"
);
write("app/assets/app.js", app);

// ------------------------------------------------------- real audit conversion path
let home = read("index.html");
home = home.replace('href="admin-systems.html#pilot">Request an Admin Audit', `href="${CONTACT}">Request an Admin Audit`);
home = home.replace('<article><span>Live</span><h3>Practice Admin</h3><p>Bookings, reminders, no-shows, front-desk admin, receptionist summaries and admin-only patient communication.</p>', '<article><span>Demo only</span><h3>Practice Admin</h3><p>Sample-only workflow demonstration. Never enter patient, health or identity information in the public prototype.</p>');
home = home.replace('<p>The Admin Department — practical admin systems for businesses tired of running everything manually.</p>', `<p>The Admin Department — practical admin systems for businesses tired of running everything manually. <a href="mailto:buttercoder.dev@gmail.com">buttercoder.dev@gmail.com</a></p>`);
if (!home.includes(CONTACT)) throw new Error("Homepage audit contact was not wired");
write("index.html", home);

let systems = read("admin-systems.html");
systems = systems.replace('<article class="card practice-card"><p class="tag">Front desk</p><h3>Practice Admin Setup</h3><p>Bookings, reminders, confirmations, documents, payments, no-shows and front-desk summaries.</p>', '<article class="card practice-card"><p class="tag">Demo only</p><h3>Practice Admin Setup</h3><p>Sample-only front-desk workflow. Public data entry is disabled; never enter patient or health information.</p>');
systems = systems.replace('<div class="hero-actions"><a class="button primary" href="app/">Open Admin HQ</a><a class="button secondary" href="index.html#audit">Request audit</a></div>', `<div class="hero-actions"><a class="button primary" href="${CONTACT}">Email audit request</a><a class="button secondary" href="app/">Open Admin HQ</a></div>`);
systems = systems.replace('<p>The Admin Department — practical admin systems for businesses tired of running everything manually.</p>', `<p>The Admin Department — practical admin systems for businesses tired of running everything manually. <a href="mailto:buttercoder.dev@gmail.com">buttercoder.dev@gmail.com</a></p>`);
if (!systems.includes(CONTACT)) throw new Error("Systems audit contact was not wired");
write("admin-systems.html", systems);

let docs = read("docs/PRODUCTION-WIRING.md");
if (!docs.includes("## Phase 1 public safety boundary")) {
  docs += `\n## Phase 1 public safety boundary\n\n- Runtime date rules use the current local calendar date; deterministic tests inject a fixed fixture date.\n- Every system displays a browser-only data warning.\n- Practice Admin is sample-only in the public deployment: add, edit and CSV import are disabled and its local data is cleared.\n- Audit CTAs open a real email request to the public project contact.\n`;
}
write("docs/PRODUCTION-WIRING.md", docs);

// Harden the reserved Supabase project before any future activation.
write("supabase/migrations/0001_restrict_rls_auto_enable.sql", `-- Reserved infrastructure hardening. The event-trigger helper must never be callable through the Data API.\nrevoke all on function public.rls_auto_enable() from public;\nrevoke all on function public.rls_auto_enable() from anon;\nrevoke all on function public.rls_auto_enable() from authenticated;\ngrant execute on function public.rls_auto_enable() to service_role;\n`);

// Expand regression coverage for the Phase 1 safety promises.
tests = read("tests/run-tests.mjs");
tests = replaceOnce(
  tests,
`for (const publicPage of [publicHome, adminSystems, launcher]) {
  assert.equal(publicPage.includes('hello@example.com'), false, 'public pages must not contain placeholder email');
  assert.equal(publicPage.includes('Open demo'), false, 'public pages must not use old demo-first CTA wording');
}`,
`for (const publicPage of [publicHome, adminSystems, launcher]) {
  assert.equal(publicPage.includes('hello@example.com'), false, 'public pages must not contain placeholder email');
  assert.equal(publicPage.includes('Open demo'), false, 'public pages must not use old demo-first CTA wording');
}
assert.ok(publicHome.includes('mailto:buttercoder.dev@gmail.com?subject=Admin%20Audit%20Request'), 'homepage has a real audit contact path');
assert.ok(adminSystems.includes('mailto:buttercoder.dev@gmail.com?subject=Admin%20Audit%20Request'), 'systems page has a real audit contact path');
assert.ok(publicHome.includes('Demo only</span><h3>Practice Admin'), 'homepage labels Practice Admin as demo only');
assert.ok(adminSystems.includes('Demo only</p><h3>Practice Admin Setup'), 'systems page labels Practice Admin as demo only');`,
  "public safety assertions"
);
write("tests/run-tests.mjs", tests);

rmSync("scripts/apply-phase1.mjs");
rmSync(".github/workflows/phase1-apply.yml");
console.log("TAD Phase 1 blockers patched.");
