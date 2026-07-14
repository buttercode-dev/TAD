const assert = require('node:assert/strict');
const fs = require('node:fs');

const home = fs.readFileSync('index.html', 'utf8');
const systems = fs.readFileSync('admin-systems.html', 'utf8');
const hq = fs.readFileSync('ops/index.html', 'utf8');
const portal = fs.readFileSync('portal/index.html', 'utf8');

for (const phrase of ['href="portal/"', 'Client Portal', 'href="ops/"', 'Admin HQ']) {
  assert.ok(home.includes(phrase), `homepage must include ${phrase}`);
}
assert.equal(home.includes('Process + people + DueToday'), false, 'homepage must not sell DueToday as the managed-service product');
assert.equal(
  home.includes('<p class="card-note">TAD runs the workflow. DueToday keeps the actions visible.</p>'),
  false,
  'homepage must not render DueToday as the managed-service product'
);
assert.ok(home.includes('private TAD Client Portal workspace'), 'service process must name the client-facing workspace');
assert.ok(systems.includes('The Client Portal shows decisions and reports'), 'systems page must explain the TAD client experience');
assert.equal(
  systems.includes('<p class="trust">TAD operates the service · DueToday carries the actions'),
  false,
  'systems page must not render DueToday as the client platform'
);

for (const phrase of [
  'id="free-software"',
  'Free self-service software',
  'Start with DueToday for free',
  'https://due-today-six.vercel.app/signup',
  'No TAD setup or data loading included',
  'No managed queue operation',
  'No automatic TAD application'
]) {
  assert.ok(home.includes(phrase), `homepage free option must include ${phrase}`);
}
assert.equal(home.includes('free managed'), false, 'DueToday must never be described as a free managed service');
assert.equal(home.includes('TAD will set up DueToday for free'), false, 'free DueToday must not create operator work');

assert.ok(hq.includes('https://due-today-six.vercel.app/hq'), 'operator entry must use the branded Admin HQ route');
assert.ok(hq.includes('Opening TAD Admin HQ'), 'operator handoff must remain TAD branded');
assert.equal(hq.includes('DueToday authentication'), false, 'operator handoff must not expose the engine brand');

assert.ok(portal.includes('https://due-today-six.vercel.app/portal'), 'client entry must use the branded portal route');
assert.ok(portal.includes('Opening your TAD Client Portal'), 'client handoff must remain TAD branded');
assert.ok(portal.includes('decisions, workflow progress and weekly service reports'), 'client entry must explain the portal purpose');

console.log('TAD public portal and free DueToday entry contract passed.');