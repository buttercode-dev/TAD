import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
  SYSTEMS,
  ID_KEY,
  buildProductionScaleDataset,
  expectedFailIds,
  assertSanitizedDataset
} from './fixtures/sanitized-production-scale-data.mjs';

process.env.NODE_ENV = 'production';

const code = readFileSync(new URL('../app/assets/engine.js', import.meta.url), 'utf8');
const context = { console, globalThis: {} };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(code, context);
const E = context.AdminEngine;
const FIXTURE_TODAY = '2026-07-10';
const now = new Date();
const currentLocalDate = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0')
].join('-');
assert.equal(E.TODAY, currentLocalDate, 'runtime TODAY must follow the current local calendar date');

const expectedFails = {
  invoice: ['INV-008', 'INV-009', 'INV-010'],
  sales: ['LEAD-008', 'LEAD-009', 'LEAD-010'],
  client: ['ONB-008', 'ONB-009', 'ONB-010'],
  property: ['PROP-008', 'PROP-009', 'PROP-010'],
  practice: ['PRAC-008', 'PRAC-009', 'PRAC-010'],
  member: ['MEM-008', 'MEM-009', 'MEM-010']
};

const routeMap = {
  publicHome: '../index.html',
  adminSystems: '../admin-systems.html',
  launcher: '../app/index.html',
  invoice: '../app/invoice-admin/index.html',
  sales: '../app/sales-admin/index.html',
  client: '../app/client-admin/index.html',
  property: '../app/property-admin/index.html',
  practice: '../app/practice-admin/index.html',
  member: '../app/member-admin/index.html'
};

for (const route of Object.values(routeMap)) {
  assert.equal(existsSync(new URL(route, import.meta.url)), true, `route file exists: ${route}`);
}

const publicHome = readFileSync(new URL(routeMap.publicHome, import.meta.url), 'utf8');
const adminSystems = readFileSync(new URL(routeMap.adminSystems, import.meta.url), 'utf8');
const launcher = readFileSync(new URL(routeMap.launcher, import.meta.url), 'utf8');

for (const publicPage of [publicHome, adminSystems, launcher]) {
  assert.equal(publicPage.includes('hello@example.com'), false, 'public pages must not contain placeholder email');
  assert.equal(publicPage.includes('Open demo'), false, 'public pages must not use old demo-first CTA wording');
}
assert.ok(publicHome.includes('mailto:buttercoder.dev@gmail.com?subject=Admin%20Audit%20Request'), 'homepage has a real audit contact path');
assert.ok(adminSystems.includes('mailto:buttercoder.dev@gmail.com?subject=Admin%20Audit%20Request'), 'systems page has a real audit contact path');
assert.ok(publicHome.includes('Demo only</span><h3>Practice Admin'), 'homepage labels Practice Admin as demo only');
assert.ok(adminSystems.includes('Demo only</p><h3>Practice Admin Setup'), 'systems page labels Practice Admin as demo only');

for (const system of SYSTEMS) {
  assert.ok(publicHome.includes(`app/${system}-admin/?demo=1`), `homepage links to ${system} sample route`);
  assert.ok(adminSystems.includes(`app/${system}-admin/?demo=1`), `Admin Systems page links to ${system} sample route`);
  assert.ok(launcher.includes(`${system}-admin/?demo=1`), `Admin HQ launcher links to ${system} sample route`);
  assert.ok(launcher.includes(`${system}-admin/`), `Admin HQ launcher links to ${system} empty route`);
}

const appRequiredIds = [
  'system-title',
  'system-subtitle',
  'add-record',
  'load-demo',
  'export-csv',
  'import-csv',
  'empty-data',
  'record-count',
  'pass-count',
  'fail-count',
  'records-table',
  'report-grid',
  'blocked-list',
  'record-modal',
  'record-form',
  'close-modal'
];

for (const system of SYSTEMS) {
  const page = readFileSync(new URL(routeMap[system], import.meta.url), 'utf8');
  assert.ok(page.includes(`data-system="${system}"`), `${system}: page has correct data-system`);
  assert.ok(page.includes('href="../assets/app.css"'), `${system}: page loads shared CSS`);
  assert.ok(page.includes('src="../assets/engine.js"'), `${system}: page loads shared engine`);
  assert.ok(page.includes('src="../assets/app.js"'), `${system}: page loads shared controller`);
  for (const id of appRequiredIds) {
    assert.ok(page.includes(`id="${id}"`), `${system}: page contains required UI id ${id}`);
  }
  for (const navSystem of SYSTEMS) {
    assert.ok(page.includes(`../${navSystem}-admin/`), `${system}: nav links to ${navSystem}`);
  }
}

const homepageCss = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const adminSystemsCss = readFileSync(new URL('../admin-systems.css', import.meta.url), 'utf8');
const appCss = readFileSync(new URL('../app/assets/app.css', import.meta.url), 'utf8');
for (const css of [homepageCss, adminSystemsCss, appCss]) {
  for (const oversized of ['108px', '112px', '100px', '8.5vw', 'min-height:460px', 'min-height:330px']) {
    assert.equal(css.includes(oversized), false, `CSS should not reintroduce oversized value ${oversized}`);
  }
}

for (const system of SYSTEMS) {
  assert.ok(E.systems[system], `${system}: system definition exists`);
  assert.ok(E.systems[system].fields.length >= 10, `${system}: has enough editable fields`);
  assert.ok(E.systems[system].statuses.length >= 8, `${system}: has enough workflow statuses`);

  const records = E.sampleRecords(system);
  const validations = records.map((r) => E.validate(system, r, records, FIXTURE_TODAY));
  const failed = records.filter((_, i) => validations[i].status === 'Fail').map((r) => r[ID_KEY[system]]);
  const passed = records.length - failed.length;
  assert.equal(records.length, 10, `${system}: sample set should contain 10 records`);
  assert.equal(passed, 7, `${system}: should pass 7 records`);
  assert.equal(JSON.stringify(failed), JSON.stringify(expectedFails[system]), `${system}: failing records should match expected blockers`);

  const report = E.report(system, records, FIXTURE_TODAY);
  assert.equal(report.total, 10, `${system}: report total should be 10`);
  assert.equal(report.passed, 7, `${system}: report passed should be 7`);
  assert.equal(report.failed, 3, `${system}: report failed should be 3`);
  const roundTrip = E.parseCSV(E.toCSV(system, records));
  assert.equal(roundTrip.length, records.length, `${system}: CSV round-trip should preserve row count`);
  assert.equal(roundTrip[0][ID_KEY[system]], records[0][ID_KEY[system]], `${system}: CSV round-trip should preserve first ID`);

  const productionRecords = buildProductionScaleDataset(E, system, 240);
  assert.equal(productionRecords.length, 240, `${system}: production-scale fixture has 240 records`);
  assertSanitizedDataset(productionRecords);
  const ids = productionRecords.map((r) => r[ID_KEY[system]]);
  assert.equal(new Set(ids).size, ids.length, `${system}: production-scale fixture IDs are unique`);
  const productionValidations = productionRecords.map((r) => E.validate(system, r, productionRecords, FIXTURE_TODAY));
  const productionFailed = productionRecords.filter((_, i) => productionValidations[i].status === 'Fail').map((r) => r[ID_KEY[system]]);
  assert.equal(JSON.stringify(productionFailed), JSON.stringify(expectedFailIds(system, 240)), `${system}: production-scale failing records are deterministic`);
  const productionReport = E.report(system, productionRecords, FIXTURE_TODAY);
  assert.equal(productionReport.total, 240, `${system}: production report total should be 240`);
  assert.equal(productionReport.passed, 168, `${system}: production report passed should be 168`);
  assert.equal(productionReport.failed, 72, `${system}: production report failed should be 72`);
  const productionRoundTrip = E.parseCSV(E.toCSV(system, productionRecords));
  assert.equal(productionRoundTrip.length, productionRecords.length, `${system}: production CSV round-trip preserves row count`);
  assert.equal(productionRoundTrip[0][ID_KEY[system]], productionRecords[0][ID_KEY[system]], `${system}: production CSV round-trip preserves first ID`);
}

console.log('All Admin HQ inventory, page-contract, scale, and production-scale regression tests passed.');
