const assert = require('node:assert/strict');
const fs = require('node:fs');
const offer = require('../sales-admin-service.js');
const audit = require('../admin-audit-v2.js');

async function main(){
 const page = fs.readFileSync('sales-admin-service.html', 'utf8');
 const code = fs.readFileSync('sales-admin-service.js', 'utf8');
 const home = fs.readFileSync('index.html', 'utf8');

 ['Sales Admin Setup and Managed Follow-up','R1,500','R4,900','R3,900/month','sales-admin-application','application-result','Submit application securely','company_website','submission-status'].forEach((phrase) => {
   assert.ok(page.includes(phrase), `service page must include ${phrase}`);
 });
 assert.ok(home.includes('sales-admin-service.html'), 'home page must route to the paid offer');
 assert.equal(page.includes('Email the application'), false, 'page must not fall back to mailto-only intake');
 assert.equal(code.includes('mailto:'), false, 'application code must use secure submission rather than mailto');
 assert.equal(offer.ENDPOINT, 'https://due-today-six.vercel.app/api/tad/applications');

 const base = {
   business: 'Example Services',
   contact: 'Owner',
   email: 'owner@invalid.example',
   activeRecords: 20,
   followUpProblem: 'missed',
   tools: 'WhatsApp and Excel',
   outcome: 'Every quote needs a next action.',
   ownerAvailable: true,
   dataAuthority: true,
   boundaryAccepted: true,
   companyWebsite: '',
 };
 const ready = offer.qualify(base);
 assert.equal(ready.ready, true);
 assert.equal(ready.score, 10);

 const payload = offer.buildPayload(base, 123456789);
 assert.deepEqual(payload, {
   business: 'Example Services',
   contact: 'Owner',
   email: 'owner@invalid.example',
   active_records: 20,
   follow_up_problem: 'missed',
   tools: 'WhatsApp and Excel',
   outcome: 'Every quote needs a next action.',
   owner_available: true,
   data_authority: true,
   boundary_accepted: true,
   company_website: '',
   started_at: 123456789,
 });

 let calledUrl = '';
 let calledOptions = null;
 const result = await offer.submitApplication(base, 123456789, async (url, options) => {
   calledUrl = url; calledOptions = options;
   return { ok: true, json: async () => ({ ok: true, reference: 'ABC12345' }) };
 });
 assert.equal(calledUrl, offer.ENDPOINT);
 assert.equal(calledOptions.method, 'POST');
 assert.equal(JSON.parse(calledOptions.body).active_records, 20);
 assert.equal(result.reference, 'ABC12345');

 const small = Object.assign({}, base, { activeRecords: 5 });
 assert.equal(offer.qualify(small).ready, false);
 const noAuthority = Object.assign({}, base, { dataAuthority: false });
 assert.equal(offer.qualify(noAuthority).ready, false);

 const auditInput = {
   business: 'Example Services', contact: 'Owner', email: 'owner@invalid.example',
   recordsPerWeek: 30, channels: 3, evidenceChecks: ['live_list'], signals: ['missed_followups'],
   areas: { invoice: 0, sales: 4, client: 0, property: 0, practice: 0, member: 0 },
   controls: { capture: 0, ownership: 0, next_action: 0, due_dates: 0, approvals: 2, visibility: 0, reporting: 0, documented: 0 },
 };
 const auditResult = audit.scoreAudit(auditInput);
 assert.equal(auditResult.primary.key, 'sales');
 assert.ok(audit.getOfferPath(auditInput, auditResult).startsWith('sales-admin-service.html?'));

 console.log('Sales Admin secure commercial flow contract passed.');
}

main().catch((error) => { console.error(error); process.exit(1); });
