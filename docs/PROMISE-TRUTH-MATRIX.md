# TAD promise truth matrix

Status meanings:

- **Proven** — implemented and covered by an automated or live regression test.
- **Implemented** — present in the product, but not all real-world dependencies are proven.
- **Manual** — a real operator procedure, not software automation.
- **Partial** — part of the promise exists, but the wording is broader than the current implementation.
- **Missing** — no reliable implementation currently exists.
- **Boundary** — intentionally excluded and must not be promised.

## Public website and intake

| Promise | Status | What is real now | Remaining condition or risk |
|---|---|---|---|
| Visitors can compare six paid services | Proven | Six service pages and six workflow previews are linked from the homepage. | Copy and prices still require human commercial review before sale. |
| Readiness is calculated in the browser first | Proven | Shared readiness logic scores active volume, repeated problem, owner availability, data authority and boundary acceptance. | A high score is not acceptance, payment or onboarding. |
| Qualified applications are submitted securely for private TAD review | Proven | Applications are posted to the authenticated intake API and appear in the operator queue. | Availability still depends on Vercel and Supabase. |
| Operational records are not submitted through the public readiness form | Proven | The form accepts only business-level facts and warns against sensitive records. | A user can still type inappropriate content into free-text fields; operator review remains required. |
| Duplicate applications are controlled | Proven | A recent application for the same email/department is recognised rather than blindly duplicated. | Legitimate repeat applications inside the duplicate window may require operator handling. |
| Invalid departments are rejected | Proven | Database and API validation reject unknown departments. | None beyond provider availability. |
| The Admin Audit runs in the browser without automatic submission | Proven | The audit is client-side and explicitly states that answers are not automatically transmitted. | TAD therefore does not receive the audit unless the prospect separately shares the output or contacts TAD. |
| Admin Audit deliverables include a workflow map, leaks, recommendation and quote | Partial | The browser diagnostic produces a score, fix-first department, root causes and pilot guidance. | A full paid audit, workflow map and implementation quote require manual TAD consulting work; payment and delivery are not built into the website. |

## Commercial process

| Promise | Status | What is real now | Remaining condition or risk |
|---|---|---|---|
| Setup prices and monthly prices are available | Implemented | Each service page publishes a launch price hypothesis. | No checkout, invoice generation or subscription billing exists in TAD. |
| Setup is paid before implementation | Manual | The operating rule is documented and the operator handoff now says to send portal activation only after scope and payment are confirmed. | Payment proof must be checked outside the platform. |
| Admin Audit fee is credited when implementation proceeds within 14 days | Manual | It is public commercial copy. | No automatic credit calculation or billing record exists. Operator must apply it manually. |
| Client can purchase a service entirely online | Missing | The client can apply online but cannot complete contract and payment online. | Do not describe the current flow as self-serve purchase or instant activation. |

## Workspace and portal activation

| Promise | Status | What is real now | Remaining condition or risk |
|---|---|---|---|
| Qualified application can create a managed workspace | Proven | Operator action creates a managed business, department engagement, initial setup action and application link. | Operator must first qualify the application. |
| Correct department is installed | Proven | Multi-department onboarding creates Invoice, Sales, Client, Property, Practice or Member engagement based on the application. | Template configuration must remain present in migrations. |
| Client receives a private Client Portal | Implemented | A verified-email claim grants access only to matching managed workspaces. Admin HQ now exposes a prefilled activation link. | Sending the link is manual. Email delivery and confirmation depend on Supabase. |
| Workspace creation automatically emails the client | Missing | No automatic invitation email is sent. | Public and operator wording must remain explicit that handoff is manual. |
| A client can claim any workspace using a URL parameter | Boundary | Explicitly prevented. The claim uses the authenticated account email from `auth.users` and accepts no browser-supplied business ID. | Changing the primary email requires a controlled operator process. |
| Multiple clients are isolated | Proven | Integration tests verify first client, second client and outsider separation. | Production policies must remain aligned with tested migrations. |
| Viewer is read-only for decisions | Proven | Viewer can read workflow information but cannot approve or respond to reports. | Viewer membership assignment is currently operator/database-driven rather than a complete invitation UI. |

## “Installation” and setup

| Promise | Status | What is real now | Remaining condition or risk |
|---|---|---|---|
| TAD installs a tracker/workspace | Proven | Managed workspace, engagement and department template are created. | Real records still have to be loaded. |
| Statuses and department-specific fields are installed | Proven | Workflow templates define statuses, closed states and fields for all six departments. | Template changes require migration and regression testing. |
| Owners, next actions and due dates can be recorded | Proven | Operator UI and database support all three. | Data quality depends on operator discipline. |
| Active records are cleaned and loaded | Manual | Operator can add and update workflow records. | There is no proven generic bulk import and deduplication interface for all six managed workflows. “Cleaned and loaded” is a human delivery obligation. |
| Up to the advertised record boundary is loaded | Manual | The scope is stated on each offer. | No automatic contracted-volume enforcement exists. Operator must count and control scope. |
| Templates are installed | Partial | Workflow templates exist; some message-draft infrastructure exists in the engine. | The promise must not imply a complete library of externally sent email/WhatsApp templates for every department. |
| Approval rules and limits are installed | Partial | Approval records, manager-only decisions and audit fields exist. | There is no complete per-client rule-builder proving monetary limits and approval chains for every service. Rules must be documented manually and reflected in how approvals are created. |
| Exception handling is installed | Implemented | Blocked reasons, statuses, attention queues and notes exist. | Operator must define each client's exception procedure. |
| Filing and completion proof are controlled | Partial | Workflow fields and completion states can record proof references/statuses. | TAD does not currently provide a complete document-management repository. Do not promise secure document storage unless separately configured and tested. |

## Daily operation

| Promise | Status | What is real now | Remaining condition or risk |
|---|---|---|---|
| TAD can review due and overdue work | Proven | Operator and client summaries calculate open, blocked, overdue and due actions. | A human must actually open and work the queue. |
| TAD runs a business-day queue | Manual | The system supports the procedure. | There is no guarantee the operator performed the daily review unless operating logs and supervision prove it. |
| Outcomes and next dates are recorded | Proven | Workflow updates and event/audit records support this. | Accuracy remains a human responsibility. |
| External follow-ups are sent automatically | Boundary | Service pages explicitly exclude automatic WhatsApp/email sending. | Any future sending integration needs consent, authority, logging, retries and separate testing. |
| TAD prepares follow-ups | Manual | Operator can prepare language outside or within available draft tools. | Generic managed-workflow UI does not prove end-to-end message preparation for every department. |
| Important actions remain human-approved | Proven for portal decisions | Manager-only approval functions are enforced and tested. | Operators must correctly decide which real-world actions require approval. |
| TAD never makes unauthorised payments or bank changes | Boundary | Product does not implement payment execution or supplier bank-detail changes. | Human process and staff training remain essential. |

## Reports and evidence

| Promise | Status | What is real now | Remaining condition or risk |
|---|---|---|---|
| Weekly reports can be produced | Proven | Service reports can be created, shown to the client and responded to. | Report creation is operator-driven; no guaranteed scheduler currently produces them automatically. |
| Two weekly reports are delivered during 14-day stabilisation | Manual | The platform can hold and display two or more reports. | Operator must create them on schedule. No automatic SLA enforcement exists. |
| Reports show completed, overdue and blocked work | Implemented | Metrics and workflow summaries support those categories. | Department-specific report quality depends on operator data quality and report configuration. |
| Client can choose Continue, Change or Stop | Proven | Manager can respond to a report and operator can see the response. | The response does not automatically change billing or close the service. Operator must act on it. |
| Reports guarantee improved revenue, payment or operations | Boundary | TAD explicitly avoids guaranteed outcomes. | Evidence shows activity and control, not guaranteed commercial results. |

## Security and permissions

| Promise | Status | What is real now | Remaining condition or risk |
|---|---|---|---|
| Admin HQ is operator-only | Proven | Allowlisted operator bootstrap and operator checks are enforced and tested. | Allowlist maintenance is a privileged production operation. |
| Ordinary users cannot become operators | Proven | Non-allowlisted accounts cannot claim the operator role. | Compromised allowlisted email remains an account-security risk. MFA is not proven by the current suite. |
| Client managers can decide | Proven | Manager role can approve/reject and respond to reports. | Identity assurance is only as strong as email account security and Supabase authentication settings. |
| Viewers cannot decide | Proven | Integration test verifies decision and report-response denial. | Other future mutation endpoints must use the same role rules. |
| Cross-workspace access is blocked | Proven | Client, second client and outsider isolation are tested against a fresh migration stack. | Production drift must be prevented by applying the same migrations and monitoring policies. |
| No system can ever fail or expose data | Impossible guarantee | Tests substantially reduce risk. | Third-party outages, credential compromise, undiscovered defects and operator mistakes remain possible. TAD needs incident response and monitoring. |

## Service-specific boundaries

### Invoice Admin

Real: controlled invoice register, completeness fields, approval queue, exception statuses, outcome and report support.

Manual/partial: document collection, deduplication, filing proof and supplier follow-up. No payments, accounting/tax advice or bank-detail changes.

### Sales Admin

Real: controlled list, owners, next actions, dates, outcome statuses, approval and report support.

Manual: follow-up preparation and sending. No automatic messaging and no guaranteed revenue.

### Client Admin

Real: onboarding workflow template, missing-step control, ownership, dates, blockers, decisions and reports.

Manual/partial: collecting documents, creating external folders, sending welcomes and verifying payment gates. No complete document repository is proven.

### Property Admin

Real: request workflow, statuses, scheduling fields, blockers, approvals and reports.

Manual: tenant/supplier communications and completion-evidence review. No emergency-dispatch or property-management accounting integration is proven.

### Practice / Booking Admin

Real: non-clinical booking workflow and protected data warning.

Boundary: patient clinical information must not be entered. No clinical decision support, medical-record system or guaranteed POPIA compliance certification is provided.

### Member Admin

Real: onboarding/attendance/payment-status/reactivation workflow fields, due dates, blockers and reports.

Manual: messages and real payment-provider checks. No direct debit collection or automatic payment recovery is implemented.

## Blocking gaps before broad paid launch

1. A written commercial acceptance and payment-proof procedure is required.
2. A production email-confirmation and resend procedure must be tested with real provider settings.
3. A controlled record-transfer and data-retention procedure is required.
4. The operator needs a repeatable import/cleanup checklist for each department.
5. The operator needs a report calendar and missed-report escalation.
6. Viewer/member invitation management needs a supported operator UI before promising easy team invitations.
7. Production monitoring and incident response need to be documented.
8. The paid Admin Audit needs a clear manual delivery process because the browser audit alone does not fulfil every paid deliverable.

## Release rule

No wording may be upgraded from Manual or Partial to Proven until both the implementation and a meaningful regression test exist. A green test suite proves the tested contract, not that third-party providers or human operations can never fail.
