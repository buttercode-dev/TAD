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
  legacyAudit: '../admin-audit.html',
  adminAudit: '../admin-audit-v2.html',
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
const legacyAudit = readFileSync(new URL(routeMap.legacyAudit, import.meta.url), 'utf8');
const adminAuditPage = readFileSync(new URL(routeMap.adminAudit, import.meta.url), 'utf8');
const adminAuditCode = readFileSync(new URL('../admin-audit-v2.js', import.meta.url), 'utf8');
const launcher = readFileSync(new URL(routeMap.launcher, import.meta.url), 'utf8');

for (const publicPage of [publicHome, adminSystems, launcher]) {
  assert.equal(publicPage.includes('hello@example.com'), false, 'public pages must not contain placeholder email');
  assert.equal(publicPage.includes('Open demo'), false, 'public pages must not use old demo-first CTA wording');
}
assert.ok(publicHome.includes('href="admin-audit.html"'), 'homepage links to the stable Admin Audit route');
assert.ok(adminSystems.includes('href="admin-audit.html"'), 'systems page links to the stable Admin Audit route');
assert.ok(legacyAudit.includes('admin-audit-v2.html'), 'legacy Admin Audit route forwards to v2');
assert.ok(adminAuditPage.includes('id="admin-audit-form"'), 'Admin Audit v2 contains the structured form');
assert.ok(adminAuditPage.includes('id="audit-result"'), 'Admin Audit v2 contains the generated result');
assert.ok(adminAuditPage.includes('data-step="4"'), 'Admin Audit v2 contains the four-step guided flow');
assert.ok(adminAuditPage.includes('id="root-causes"'), 'Admin Audit v2 explains root causes');
assert.ok(adminAuditPage.includes('id="pilot-plan"'), 'Admin Audit v2 produces a controlled pilot plan');
assert.ok(adminAuditPage.includes('does not store or transmit answers automatically'), 'Admin Audit v2 states its no-storage boundary');
assert.equal(adminAuditCode.includes('fetch('), false, 'Admin Audit must not transmit data automatically');
assert.equal(adminAuditCode.includes('localStorage'), false, 'Admin Audit must not persist answers in local storage');
assert.equal(adminAuditCode.includes('sessionStorage'), false, 'Admin Audit must not persist answers in session storage');

const auditContext = { console, globalThis: {} };
auditContext.globalThis = auditContext;
vm.createContext(auditContext);
vm.runInContext(adminAuditCode, auditContext);
const A = auditContext.AdminAudit;

const phase3Cases = {
  trafalgar: {
    areas: { property: 4, invoice: 1, sales: 1, client: 2, practice: 0, member: 0 },
    controls: { capture: 2, ownership: 2, next_action: 1, due_dates: 1, approvals: 1, visibility: 1, reporting: 1, documented: 2 },
    signals: ['property_requests', 'approvals_stuck', 'manual_reporting', 'owner_visibility'],
    evidenceChecks: ['live_list', 'recent_report']
  },
  zone: {
    areas: { member: 4, sales: 1, invoice: 1, client: 1, property: 0, practice: 0 },
    controls: { capture: 2, ownership: 2, next_action: 1, due_dates: 1, approvals: 3, visibility: 1, reporting: 1, documented: 2 },
    signals: ['member_churn', 'manual_reporting', 'owner_visibility'],
    evidenceChecks: ['live_list']
  },
  sorbet: {
    areas: { practice: 4, sales: 1, client: 2, invoice: 0, property: 0, member: 0 },
    controls: { capture: 3, ownership: 2, next_action: 2, due_dates: 2, approvals: 3, visibility: 2, reporting: 1, documented: 2 },
    signals: ['booking_admin', 'manual_reporting'],
    evidenceChecks: ['written_process', 'sample_records']
  },
  rentokil: {
    areas: { client: 4, sales: 2, invoice: 0, property: 0, practice: 0, member: 0 },
    controls: { capture: 3, ownership: 3, next_action: 2, due_dates: 2, approvals: 3, visibility: 3, reporting: 3, documented: 3 },
    signals: ['missing_documents', 'manual_reporting'],
    evidenceChecks: ['written_process', 'recent_report', 'sample_records']
  },
  stuttafordControl: {
    areas: { invoice: 1, sales: 2, client: 3, property: 0, practice: 0, member: 0 },
    controls: { capture: 4, ownership: 4, next_action: 4, due_dates: 4, approvals: 4, visibility: 4, reporting: 4, documented: 4 },
    signals: [],
    evidenceChecks: ['live_list', 'written_process', 'recent_report', 'sample_records']
  }
};

assert.equal(A.scoreAudit(phase3Cases.trafalgar).top[0].key, 'property', 'Trafalgar-like workflow ranks Property Admin first');
assert.equal(A.scoreAudit(phase3Cases.zone).top[0].key, 'member', 'Zone-like workflow ranks Member Admin first');
assert.equal(A.scoreAudit(phase3Cases.sorbet).top[0].key, 'practice', 'Sorbet-like workflow ranks Practice / Booking Admin first');
assert.equal(A.scoreAudit(phase3Cases.rentokil).top[0].key, 'client', 'Rentokil-like workflow ranks Client Admin first');
assert.notEqual(A.scoreAudit(phase3Cases.stuttafordControl).top[0].key, 'invoice', 'mature supplier controls do not falsely rank Invoice Admin first');
const phase3Result = A.scoreAudit(phase3Cases.trafalgar);
assert.equal(phase3Result.pilot.days.length, 4, 'audit produces a four-stage 14-day pilot');
assert.ok(phase3Result.rootCauses.length > 0, 'audit explains root causes');
assert.ok(phase3Result.primary.measures.length >= 4, 'audit produces success measures');
assert.ok(A.formatBrief({ business: 'Test', teamSize: '2–5', signals: [] }, phase3Result).includes('14-DAY CONTROLLED PILOT'), 'email brief includes pilot plan');

assert.ok(publicHome.includes('Demo only</span><h3>Practice Admin'), 'homepage labels Practice Admin as demo only');
assert.ok(adminSystems.includes('Demo only</p><h3>Practice Admin Setup'), 'systems page labels Practice Admin as demo only');

for (const system of SYSTEMS) {
  assert.ok(publicHome.includes(`app/${system}-admin/?demo=1`), `homepage links to ${system} sample route`);
  assert.ok(adminSystems.includes(`app/${system}-admin/?demo=1`), `Admin Systems page links to ${system} sample route`);
  assert.ok(launcher.includes(`${system}-admin/?demo=1`), `Admin HQ launcher links to ${system} sample route`);
  assert.ok(launcher.includes(`${system}-admin/`), `Admin HQ launcher links to ${system} empty route`);
}

const appRequiredIds = [
  'system-title', 'system-subtitle', 'add-record', 'load-demo', 'export-csv',
  'import-csv', 'empty-data', 'record-count', 'pass-count', 'fail-count',
  'records-table', 'report-grid', 'blocked-list', 'record-modal', 'record-form', 'close-modal'
];

for (const system of SYSTEMS) {
  const page = readFileSync(new URL(routeMap[system], import.meta.url), 'utf8');
  assert.ok(page.includes(`data-system="${system}"`), `${system}: page has correct data-system`);
  assert.ok(page.includes('href="../assets/app.css"'), `${system}: page loads shared CSS`);
  assert.ok(page.includes('src="../assets/engine.js"'), `${system}: page loads shared engine`);
  assert.ok(page.includes('src="../assets/app.js"'), `${system}: page loads shared controller`);
  for (const id of appRequiredIds) assert.ok(page.includes(`id="${id}"`), `${system}: page contains required UI id ${id}`);
  for (const navSystem of SYSTEMS) assert.ok(page.includes(`../${navSystem}-admin/`), `${system}: nav links to ${navSystem}`);
}

const homepageCss = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const adminSystemsCss = readFileSync(new URL('../admin-systems.css', import.meta.url), 'utf8');
const auditCss = readFileSync(new URL('../admin-audit-v2.css', import.meta.url), 'utf8');
const appCss = readFileSync(new URL('../app/assets/app.css', import.meta.url), 'utf8');
for (const css of [homepageCss, adminSystemsCss, auditCss, appCss]) {
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
  assert.equal(records.length, 10, `${system}: sample set should contain 10 records`);
  assert.equal(records.length - failed.length, 7, `${system}: should pass 7 records`);
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

console.log('All Admin HQ and Phase 3 public-evidence audit regression tests passed.');
