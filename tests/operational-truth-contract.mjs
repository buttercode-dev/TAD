import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const home = read('index.html');
const readme = read('README.md');
const wiring = read('docs/PRODUCTION-WIRING.md');
const manual = read('docs/TAD-OPERATING-MANUAL.md');
const truth = read('docs/PROMISE-TRUTH-MATRIX.md');
const tests = read('docs/PERMANENT-TESTS.md');
const portal = read('portal/index.html');
const hq = read('ops/index.html');
const offerScript = read('admin-service-offer.js');

for (const phrase of [
  'Application is not instant activation',
  'Payment is handled manually before implementation',
  'does not automatically email the client',
  'same verified email supplied in the application',
  'No automatic purchase',
]) {
  assert.ok(home.includes(phrase), `homepage must disclose: ${phrase}`);
}

for (const phrase of [
  'Complete TAD operating manual',
  'Promise truth matrix',
  'Why the permanent tests exist',
  'browser audit is only the diagnostic front door',
]) {
  assert.ok(readme.includes(phrase), `README must include ${phrase}`);
}

for (const phrase of [
  'Buttercode-systems/TAD',
  'Buttercode-systems/DTC',
  'split architecture',
  'Public workflow previews remain browser-only sample systems',
  'Payment collection',
  'verified-email client access',
]) {
  assert.ok(wiring.toLowerCase().includes(phrase.toLowerCase()), `production wiring must include ${phrase}`);
}

for (const phrase of [
  'Application is not instant activation',
  'Creating a workspace does not automatically email the client',
  'Installation does not mean downloading an app',
  'Payment is currently handled manually',
  'Daily operation',
  'Viewer can see the item but cannot decide',
  'Go-live checklist for each paying client',
  'Do not mark a client Converted until portal access',
]) {
  assert.ok(manual.includes(phrase), `operating manual must include ${phrase}`);
}

for (const phrase of [
  'Client can purchase a service entirely online',
  'Missing',
  'Workspace creation automatically emails the client',
  'No complete document-management repository',
  'Viewer is read-only for decisions',
  'No system can ever fail or expose data',
  'Impossible guarantee',
]) {
  assert.ok(truth.includes(phrase), `truth matrix must include ${phrase}`);
}

for (const phrase of [
  'A permanent test is a repeatable check',
  'temporary, isolated Supabase stack',
  'What permanent tests do not prove',
  'Yes.',
  'never merge while a relevant test is red',
]) {
  assert.ok(tests.includes(phrase), `permanent-test guide must include ${phrase}`);
}

assert.ok(portal.includes('https://due-today-six.vercel.app/portal'), 'public Client Portal entry must target the authenticated portal');
assert.ok(hq.includes('https://due-today-six.vercel.app/hq'), 'public Admin HQ entry must target the authenticated HQ');
assert.ok(offerScript.includes("var ENDPOINT='https://due-today-six.vercel.app/api/tad/applications'"), 'paid offers must submit to the authenticated intake');
assert.equal(offerScript.includes('payment'), false, 'public application script must not pretend to collect payment');
assert.equal(offerScript.includes('workspace'), false, 'public application script must not create workspaces directly');

console.log('TAD operational truth contract passed.');
