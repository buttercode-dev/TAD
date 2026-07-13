import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const files = {
  home: read('index.html'),
  readme: read('README.md'),
  wiring: read('docs/PRODUCTION-WIRING.md'),
  manual: read('docs/TAD-OPERATING-MANUAL.md'),
  truth: read('docs/PROMISE-TRUTH-MATRIX.md'),
  permanentTests: read('docs/PERMANENT-TESTS.md'),
  portal: read('portal/index.html'),
  hq: read('ops/index.html'),
  offerScript: read('admin-service-offer.js'),
};

for (const [name, content] of Object.entries(files)) {
  assert.ok(content.trim().length > 100, `${name} must contain meaningful content`);
}

const home = files.home.toLowerCase();
for (const phrase of [
  'application is not instant activation',
  'payment is handled manually before implementation',
  'does not automatically email the client',
  'same verified email supplied in the application',
  'no automatic purchase',
]) {
  assert.ok(home.includes(phrase), `homepage must disclose ${phrase}`);
}

const manual = files.manual.toLowerCase();
for (const phrase of [
  'a ready result does not mean automatic acceptance',
  'no workspace is created',
  'payment is currently handled manually',
  'client portal activation link',
  'daily operation',
  'go-live checklist for each paying client',
]) {
  assert.ok(manual.includes(phrase), `operating manual must include ${phrase}`);
}

const truth = files.truth.toLowerCase();
for (const phrase of [
  'client can purchase a service entirely online',
  'workspace creation automatically emails the client',
  'viewer is read-only for decisions',
  'impossible guarantee',
  'blocking gaps before broad paid launch',
]) {
  assert.ok(truth.includes(phrase), `truth matrix must include ${phrase}`);
}

const permanentTests = files.permanentTests.toLowerCase();
for (const phrase of [
  'a permanent test is a repeatable check',
  'what permanent tests do not prove',
  'never merge while a relevant test is red',
]) {
  assert.ok(permanentTests.includes(phrase), `permanent-test guide must include ${phrase}`);
}

assert.ok(files.wiring.includes('Buttercode-systems/TAD'));
assert.ok(files.wiring.includes('Buttercode-systems/DTC'));
assert.ok(files.portal.includes('https://due-today-six.vercel.app/portal'));
assert.ok(files.hq.includes('https://due-today-six.vercel.app/hq'));
assert.ok(files.offerScript.includes("var ENDPOINT='https://due-today-six.vercel.app/api/tad/applications'"));
assert.equal(files.offerScript.includes('payment'), false, 'public application code must not pretend to collect payment');
assert.equal(files.offerScript.includes('workspace'), false, 'public application code must not create workspaces');

console.log('TAD operational truth contract passed.');
