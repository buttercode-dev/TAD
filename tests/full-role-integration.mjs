import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.API_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(url && anonKey && serviceKey, 'Local Supabase URL, anon key and service-role key are required');

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const anonymous = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const password = 'Tad-E2E-Only-2026!';
const stamp = Date.now();

const identities = {
  operator: { email: `operator-${stamp}@tad.test`, business: 'TAD Test Operator' },
  client: { email: `client-${stamp}@tad.test`, business: 'Client One Pty Ltd' },
  client2: { email: `client2-${stamp}@tad.test`, business: 'Client Two Pty Ltd' },
  viewer: { email: `viewer-${stamp}@tad.test`, business: 'Viewer User' },
  outsider: { email: `outsider-${stamp}@tad.test`, business: 'Outsider User' },
};

async function createUser(identity) {
  const { data, error } = await admin.auth.admin.createUser({
    email: identity.email,
    password,
    email_confirm: true,
    user_metadata: { business_name: identity.business },
  });
  assert.ifError(error);
  assert.ok(data.user?.id);
  return data.user;
}

async function signedIn(email) {
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assert.ifError(error);
  assert.ok(data.session?.access_token);
  return client;
}

async function rpcOk(client, fn, args = {}) {
  const { data, error } = await client.rpc(fn, args);
  assert.ifError(error);
  return data;
}

async function rpcFails(client, fn, args = {}, pattern = /access|operator|manager|not authenticated/i) {
  const { error } = await client.rpc(fn, args);
  assert.ok(error, `${fn} should fail`);
  assert.match(error.message, pattern);
}

const users = {};
for (const [key, identity] of Object.entries(identities)) users[key] = await createUser(identity);

assert.ifError((await admin.from('platform_operators').insert({ user_id: users.operator.id, role: 'admin', active: true })).error);

const operator = await signedIn(identities.operator.email);
const client = await signedIn(identities.client.email);
const client2 = await signedIn(identities.client2.email);
const viewer = await signedIn(identities.viewer.email);
const outsider = await signedIn(identities.outsider.email);

assert.equal(await rpcOk(operator, 'is_current_tad_operator'), true);
assert.equal(await rpcOk(client, 'is_current_tad_operator'), false);
await rpcFails(client, 'list_tad_applications');

const departments = [
  ['invoice', 'missing_information', identities.client2.email, identities.client2.business],
  ['sales', 'missed', identities.client.email, identities.client.business],
  ['client', 'missing_documents', `client-admin-${stamp}@tad.test`, 'Client Admin Test'],
  ['property', 'lost_requests', `property-${stamp}@tad.test`, 'Property Test'],
  ['practice', 'booking_gaps', `practice-${stamp}@tad.test`, 'Practice Test'],
  ['member', 'churn_risk', `member-${stamp}@tad.test`, 'Member Test'],
];

const submitted = new Map();
for (const [department, problem, email, business] of departments) {
  const result = await rpcOk(anonymous, 'submit_tad_department_application', {
    p_department: department,
    p_business_name: business,
    p_contact_name: 'Test Primary Contact',
    p_email: email,
    p_active_records: 20,
    p_workflow_problem: problem,
    p_current_tools: 'Email, WhatsApp and spreadsheets',
    p_required_outcome: 'Every active record must have an owner, next action and due date.',
    p_owner_available: true,
    p_data_authority: true,
    p_boundary_accepted: true,
    p_request_fingerprint: `${department}-${String(stamp).padEnd(64, '0')}`.slice(0, 64),
    p_source: `${department}_admin_e2e`,
  });
  assert.equal(result.department, department);
  assert.equal(result.duplicate, false);
  assert.equal(result.readiness_ready, true);
  submitted.set(department, result.id);
}

const duplicate = await rpcOk(anonymous, 'submit_tad_department_application', {
  p_department: 'sales',
  p_business_name: identities.client.business,
  p_contact_name: 'Test Primary Contact',
  p_email: identities.client.email,
  p_active_records: 20,
  p_workflow_problem: 'missed',
  p_current_tools: 'Email',
  p_required_outcome: 'Every active record has a dated next action.',
  p_owner_available: true,
  p_data_authority: true,
  p_boundary_accepted: true,
  p_request_fingerprint: `duplicate-${String(stamp).padEnd(64, '1')}`.slice(0, 64),
  p_source: 'sales_admin_e2e',
});
assert.equal(duplicate.duplicate, true);
await rpcFails(anonymous, 'submit_tad_department_application', {
  p_department: 'unknown', p_business_name: 'Bad', p_contact_name: 'Bad User', p_email: 'bad@example.com',
  p_active_records: 20, p_workflow_problem: 'missed', p_current_tools: null,
  p_required_outcome: 'Should fail safely', p_owner_available: true, p_data_authority: true,
  p_boundary_accepted: true, p_request_fingerprint: 'x'.repeat(64), p_source: 'bad',
}, /invalid_department/i);

const queue = await rpcOk(operator, 'list_tad_applications');
assert.equal(queue.applications.length, 6);
assert.deepEqual(new Set(queue.applications.map((item) => item.department)), new Set(departments.map(([department]) => department)));

async function qualifyAndOnboard(department) {
  const id = submitted.get(department);
  const review = await rpcOk(operator, 'update_tad_application', {
    p_application_id: id,
    p_status: 'qualified',
    p_qualification_notes: 'E2E qualification passed with real authority boundaries.',
    p_commercial_decision: 'accepted',
  });
  assert.equal(review.status, 'qualified');
  const onboarding = await rpcOk(operator, 'start_tad_application_onboarding', { p_application_id: id });
  assert.ok(onboarding.business_id);
  assert.equal(onboarding.department, department);
  return onboarding.business_id;
}

const salesBusinessId = await qualifyAndOnboard('sales');
const invoiceBusinessId = await qualifyAndOnboard('invoice');
assert.notEqual(salesBusinessId, invoiceBusinessId);

const clientClaim = await rpcOk(client, 'claim_tad_client_access');
assert.equal(clientClaim.claimed, 1);
const client2Claim = await rpcOk(client2, 'claim_tad_client_access');
assert.equal(client2Claim.claimed, 1);
const outsiderClaim = await rpcOk(outsider, 'claim_tad_client_access');
assert.equal(outsiderClaim.claimed, 0);

const clientBusinesses = await rpcOk(client, 'list_accessible_businesses');
assert.deepEqual(clientBusinesses.map((business) => business.id), [salesBusinessId]);
const client2Businesses = await rpcOk(client2, 'list_accessible_businesses');
assert.deepEqual(client2Businesses.map((business) => business.id), [invoiceBusinessId]);
assert.deepEqual(await rpcOk(outsider, 'list_accessible_businesses'), []);

assert.ifError((await admin.from('business_memberships').insert({
  business_id: salesBusinessId, user_id: users.viewer.id, role: 'viewer', active: true,
})).error);

const operatorWorkflow = await rpcOk(operator, 'get_service_workflow', { p_business_id: salesBusinessId });
assert.equal(operatorWorkflow.engagement.department, 'sales');
const engagementId = operatorWorkflow.engagement.id;

const workItem = await rpcOk(operator, 'create_service_work_item', {
  p_business_id: salesBusinessId,
  p_engagement_id: engagementId,
  p_reference: 'E2E-SALES-001',
  p_title: 'Follow up accepted quote',
  p_status: null,
  p_assigned_name: 'TAD Operator',
  p_priority: 90,
  p_next_action: 'Prepare client-approved follow-up',
  p_due_date: new Date().toISOString().slice(0, 10),
  p_blocked_reason: null,
  p_data: { synthetic: true },
});
assert.equal(workItem.reference, 'E2E-SALES-001');

const clientWorkflow = await rpcOk(client, 'get_service_workflow', { p_business_id: salesBusinessId });
assert.equal(clientWorkflow.items.length, 1);
const viewerWorkflow = await rpcOk(viewer, 'get_service_workflow', { p_business_id: salesBusinessId });
assert.equal(viewerWorkflow.items.length, 1);
await rpcFails(client, 'get_service_workflow', { p_business_id: invoiceBusinessId }, /business not accessible/i);
await rpcFails(outsider, 'get_service_workflow', { p_business_id: salesBusinessId }, /business not accessible/i);

const { data: approval, error: approvalError } = await admin.from('service_approvals').insert({
  business_id: salesBusinessId,
  engagement_id: engagementId,
  title: 'Approve synthetic follow-up',
  detail: 'No external message will be sent by this test.',
  status: 'pending',
  due_date: new Date().toISOString().slice(0, 10),
  requested_by: users.operator.id,
}).select().single();
assert.ifError(approvalError);

await rpcFails(viewer, 'decide_client_service_approval', {
  p_approval_id: approval.id, p_decision: 'approved', p_note: 'Viewer must not approve',
}, /manager access required/i);
const decision = await rpcOk(client, 'decide_client_service_approval', {
  p_approval_id: approval.id, p_decision: 'approved', p_note: 'Approved by client manager in E2E test.',
});
assert.equal(decision.status, 'approved');
await rpcFails(client, 'decide_client_service_approval', {
  p_approval_id: approval.id, p_decision: 'approved', p_note: 'Duplicate decision',
}, /already decided/i);

const today = new Date().toISOString().slice(0, 10);
const { data: report, error: reportError } = await admin.from('service_reports').insert({
  business_id: salesBusinessId,
  engagement_id: engagementId,
  period_start: today,
  period_end: today,
  metrics: { actions_completed: 1, synthetic: true },
  summary: 'Synthetic weekly report for role verification.',
  status: 'ready',
  created_by: users.operator.id,
}).select().single();
assert.ifError(reportError);

await rpcFails(viewer, 'respond_to_service_report', {
  p_report_id: report.id, p_response: 'continue', p_note: 'Viewer must not respond',
}, /manager access required/i);
const reportResponse = await rpcOk(client, 'respond_to_service_report', {
  p_report_id: report.id, p_response: 'continue', p_note: 'Continue after successful E2E verification.',
});
assert.equal(reportResponse.response, 'continue');

const clientResponses = await rpcOk(operator, 'get_tad_client_responses');
assert.equal(clientResponses.length, 1);
assert.equal(clientResponses[0].business_id, salesBusinessId);
assert.equal(clientResponses[0].client_response, 'continue');

const applicationAfter = (await rpcOk(operator, 'list_tad_applications')).applications.find((item) => item.id === submitted.get('sales'));
assert.equal(applicationAfter.managed_business_id, salesBusinessId);
assert.equal(applicationAfter.status, 'onboarding');

console.log(JSON.stringify({
  result: 'passed',
  applications: 6,
  operator: true,
  clientManager: true,
  viewerReadOnly: true,
  outsiderIsolated: true,
  workspaceIsolation: true,
  duplicateProtection: true,
  approvalLoop: true,
  reportLoop: true,
  clientAccessClaim: true,
}));
