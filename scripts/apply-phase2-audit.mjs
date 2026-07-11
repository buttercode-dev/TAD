import { readFileSync, writeFileSync } from 'node:fs';

function patch(path, replacements) {
  let content = readFileSync(path, 'utf8');
  for (const [from, to, label] of replacements) {
    if (!content.includes(from)) throw new Error(`Missing patch target: ${label}`);
    content = content.replace(from, to);
  }
  writeFileSync(path, content);
}

patch('index.html', [
  ['<a class="nav-cta" href="#audit">Audit</a>', '<a class="nav-cta" href="admin-audit.html">Audit</a>', 'homepage audit nav'],
  ['<a class="button primary" href="mailto:buttercoder.dev@gmail.com?subject=Admin%20Audit%20Request">Request an Admin Audit</a>', '<a class="button primary" href="admin-audit.html">Build my Admin Audit</a>', 'homepage audit CTA']
]);

patch('admin-systems.html', [
  ['<a class="nav-cta" href="#pilot">Pilot</a>', '<a class="nav-cta" href="admin-audit.html">Audit</a>', 'systems audit nav'],
  ['<a class="button primary" href="mailto:buttercoder.dev@gmail.com?subject=Admin%20Audit%20Request">Email audit request</a>', '<a class="button primary" href="admin-audit.html">Build my Admin Audit</a>', 'systems audit CTA']
]);

let tests = readFileSync('tests/run-tests.mjs', 'utf8');
tests = tests.replace(
  "  adminSystems: '../admin-systems.html',",
  "  adminSystems: '../admin-systems.html',\n  adminAudit: '../admin-audit.html',"
);
tests = tests.replace(
  "const launcher = readFileSync(new URL(routeMap.launcher, import.meta.url), 'utf8');",
  "const launcher = readFileSync(new URL(routeMap.launcher, import.meta.url), 'utf8');\nconst adminAuditPage = readFileSync(new URL(routeMap.adminAudit, import.meta.url), 'utf8');\nconst adminAuditCode = readFileSync(new URL('../admin-audit.js', import.meta.url), 'utf8');"
);
tests = tests.replace(
  "assert.ok(publicHome.includes('mailto:buttercoder.dev@gmail.com?subject=Admin%20Audit%20Request'), 'homepage has a real audit contact path');\nassert.ok(adminSystems.includes('mailto:buttercoder.dev@gmail.com?subject=Admin%20Audit%20Request'), 'systems page has a real audit contact path');",
  "assert.ok(publicHome.includes('href=\"admin-audit.html\"'), 'homepage links to the structured Admin Audit');\nassert.ok(adminSystems.includes('href=\"admin-audit.html\"'), 'systems page links to the structured Admin Audit');\nassert.ok(adminAuditPage.includes('id=\"admin-audit-form\"'), 'Admin Audit contains the structured form');\nassert.ok(adminAuditPage.includes('id=\"audit-result\"'), 'Admin Audit contains the generated result');\nassert.ok(adminAuditPage.includes('does not store or transmit your answers automatically'), 'Admin Audit states its no-storage boundary');\nassert.equal(adminAuditCode.includes('fetch('), false, 'Admin Audit must not transmit data automatically');\nconst auditContext = { console, globalThis: {} };\nauditContext.globalThis = auditContext;\nvm.createContext(auditContext);\nvm.runInContext(adminAuditCode, auditContext);\nconst auditResult = auditContext.AdminAudit.scoreAudit({ areas: { invoice: 4, sales: 1, client: 2, property: 0, practice: 0, member: 0 }, signals: ['late_invoices', 'approvals_stuck'] });\nassert.equal(auditResult.top[0].key, 'invoice', 'invoice pain and signals rank Invoice Admin first');\nassert.ok(auditResult.overall > 0, 'Admin Audit returns a meaningful score');"
);
writeFileSync('tests/run-tests.mjs', tests);
console.log('Phase 2 Admin Audit links and regression checks applied.');
