import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'README.md',
  'index.html',
  'docs/PRODUCTION-WIRING.md',
  'docs/TAD-OPERATING-MANUAL.md',
  'docs/PROMISE-TRUTH-MATRIX.md',
  'docs/PERMANENT-TESTS.md',
  'portal/index.html',
  'ops/index.html',
  'admin-service-offer.js',
];

for (const path of requiredFiles) {
  const url = new URL(`../${path}`, import.meta.url);
  assert.equal(existsSync(url), true, `${path} must exist`);
  assert.ok(readFileSync(url, 'utf8').trim().length > 100, `${path} must contain meaningful content`);
}

const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const manual = readFileSync(new URL('../docs/TAD-OPERATING-MANUAL.md', import.meta.url), 'utf8');
const truth = readFileSync(new URL('../docs/PROMISE-TRUTH-MATRIX.md', import.meta.url), 'utf8');
const permanentTests = readFileSync(new URL('../docs/PERMANENT-TESTS.md', import.meta.url), 'utf8');
const wiring = readFileSync(new URL('../docs/PRODUCTION-WIRING.md', import.meta.url), 'utf8');
const portal = readFileSync(new URL('../portal/index.html', import.meta.url), 'utf8');
const hq = readFileSync(new URL('../ops/index.html', import.meta.url), 'utf8');
const offerScript = readFileSync(new URL('../admin-service-offer.js', import.meta.url), 'utf8');

assert.match(home, /Application is not instant activation/i);
assert.match(home, /Payment is handled manually before implementation/i);
assert.match(manual, /Payment is currently handled manually outside the TAD platform/i);
assert.match(manual, /Go-live checklist for each paying client/i);
assert.match(truth, /Blocking gaps before broad paid launch/i);
assert.match(truth, /Impossible guarantee/i);
assert.match(permanentTests, /What permanent tests do not prove/i);
assert.match(wiring, /Buttercode-systems\/TAD/);
assert.match(wiring, /Buttercode-systems\/DTC/);
assert.ok(portal.includes('https://due-today-six.vercel.app/portal'));
assert.ok(hq.includes('https://due-today-six.vercel.app/hq'));
assert.ok(offerScript.includes("var ENDPOINT='https://due-today-six.vercel.app/api/tad/applications'"));

console.log('TAD operational truth contract passed.');
