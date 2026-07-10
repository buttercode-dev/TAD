# Admin HQ QA Inventory — 2026-07-10

## Scope

This inventory covers the static Admin HQ product surface and public marketing surface in the repository.

It does not authorize or perform production deployment, destructive data actions, or use of sensitive data.

## Roles / user contexts

There is no authentication layer yet, so these are usage contexts, not enforced permissions.

| Role / context | What they can see now | Acceptance criteria |
|---|---|---|
| Public visitor | Homepage, Admin Systems page, Admin HQ launcher | Can understand the offer and reach the working systems without broken links. |
| Pilot evaluator | All six system sample pages | Can open sample data, inspect pass/fail records, search/filter, export CSV and understand blocked items. |
| Admin operator | A selected system page | Can add/edit records, import/export CSV, clear local records intentionally, and use the blocked queue. |
| Internal builder | Repo docs and tests | Can run `node tests/run-tests.mjs` and verify the engine, routes, sample data, sanitized production fixtures and CSV round-trip. |
| Future team user | Not implemented | Must wait for Supabase Auth, database, RLS, roles, backups and audit log. |

## Route inventory

| Route | Purpose | Acceptance criteria | Risk-based edge cases |
|---|---|---|---|
| `/` / `index.html` | Main homepage | Primary CTA opens `app/`; six department cards link to live sample systems. | Mobile nav collapse; stale placeholder links; long heading wrap. |
| `/admin-systems.html` | Product/sales page | Shows six working systems and links to each working system route. | Pricing/CTA clarity; old demo links becoming primary; mobile card stacking. |
| `/app/` | Admin HQ launcher | Shows all six system cards and sample/empty links. | Six-card layout on tablet/mobile; no broken relative links. |
| `/app/invoice-admin/` | Invoice system | Loads shared CSS, engine and controller; supports empty and sample data. | Existing localStorage, missing owner, missing approver, missing links. |
| `/app/sales-admin/` | Sales system | Loads shared CSS, engine and controller; supports empty and sample data. | Quote sent without follow-up, ownerless lead, lost/cold without reason. |
| `/app/client-admin/` | Client system | Loads shared CSS, engine and controller; supports empty and sample data. | Ready/Active with incomplete docs, payment, agreement, folder or handover. |
| `/app/property-admin/` | Property system | Loads shared CSS, engine and controller; supports empty and sample data. | Approved without owner approval, completed without proof, ownerless request. |
| `/app/practice-admin/` | Practice system | Loads shared CSS, engine and controller; supports empty and sample data. | Ready without confirmation/payment/docs, no-show without reason, missing record link. |
| `/app/member-admin/` | Member system | Loads shared CSS, engine and controller; supports empty and sample data. | Active without onboarding/payment, payment due without owner/follow-up, cancellation without reason. |

## Feature inventory

| Feature | User-facing controls | Acceptance criteria | Finite edge cases |
|---|---|---|---|
| Marketing navigation | Home/Admin HQ/Systems/Departments/Audit links | Links resolve to intended repo routes and anchors. | Hidden mobile nav still leaves CTA reachable. |
| Marketing CTAs | Open Admin HQ, View working systems, Request Audit | No placeholder email; no old demo-first CTA. | CTA remains visible on mobile. |
| Admin HQ launcher | Open sample, Open empty per system | Each of six systems has both links. | Relative links work from `/app/`; six-card layout does not overflow. |
| System navigation | Invoice/Sales/Client/Property/Practice/Member top links | All system pages expose all six links. | Top nav wraps without hiding critical route access. |
| Load sample data | `Load sample data` button and `?demo=1` route | Sample data appears only when local system storage is empty or button is clicked. | Existing localStorage should not be overwritten by URL visit alone. |
| Add record | `Add record` button | Opens modal with fields for the active system. | Empty required fields become validation failures where rules require them. |
| Edit record | `Edit` / `Edit record` buttons | Opens modal with existing values; save updates same record. | Long text and blank optional fields do not break modal. |
| Dynamic form inputs | Text, date, number, status select and enum select inputs | Inputs match the active system field definitions. | Empty status, invalid dates, long strings, commas/quotes in text. |
| Modal | Dialog with Cancel and Save record | Cancel closes without saving; Save persists to localStorage. | Mobile modal scroll; keyboard focus; repeated open/close. |
| Metrics | Total, Passed, Blocked | Counts match engine validation output. | Empty state, all pass, all fail, production-scale dataset. |
| Calculated report | System-specific report grid | Report totals derive from engine data, not static copy. | Currency amounts, no records, large records. |
| Blocked queue | Blocked records list | Shows every failed record ID and reason; clear state shown when no blocked records. | Multiple reasons per record, long reason text. |
| Search | Search box | Searches record content and validation reasons. | No matches, case differences, punctuation. |
| Filters | All / Blocked / Passed / status chips | Filtering matches pass/fail or status. | Filter after search, filter with zero results. |
| CSV export | Export CSV button | Downloads active system records with headers and escaped values. | Commas, quotes and newlines in field values. |
| CSV import | File input | Parses CSV rows into records and rerenders validations. | Empty CSV, quoted values, missing optional columns. |
| Clear data | Clear button + browser confirm | Only clears after user confirmation. | Cancel confirmation, empty localStorage. |
| Local storage | Per-system browser localStorage key | Data separation between all six systems. | Existing stale data, clear one system only. |
| Mobile cards | Record cards below table area | Mobile layout uses cards instead of forcing table interaction. | Long IDs, fail badges, no matching records. |

## Input inventory by system

### Invoice Admin

`record_id`, `received_date`, `supplier_name`, `document_type`, `invoice_number`, `due_date`, `total_amount`, `status`, `assigned_to`, `approval_owner`, `document_link`, `folder_link`, `missing_info`, `duplicate_check`, `next_action`, `next_action_due`.

### Sales Admin

`lead_id`, `received_date`, `contact_name`, `source`, `service_needed`, `urgency`, `status`, `assigned_to`, `first_response_sent`, `quote_sent_date`, `quote_amount`, `follow_up_due`, `next_action`, `outcome_reason`.

### Client Admin

`client_id`, `start_date`, `client_name`, `service_package`, `status`, `assigned_to`, `welcome_sent`, `documents_received`, `missing_documents`, `agreement_status`, `payment_status`, `folder_created`, `folder_link`, `internal_handover`, `next_action`, `next_action_due`.

### Property Admin

`property_record_id`, `received_date`, `property_name`, `unit`, `tenant_name`, `request_type`, `urgency`, `status`, `assigned_to`, `owner_approval`, `quote_amount`, `supplier`, `scheduled_date`, `proof_link`, `next_action`, `next_action_due`.

### Practice Admin

`booking_id`, `received_date`, `patient_name`, `service`, `channel`, `appointment_date`, `status`, `assigned_to`, `confirmation_sent`, `payment_status`, `documents_received`, `no_show_risk`, `folder_link`, `next_action`, `next_action_due`, `outcome_reason`.

### Member Admin

`member_id`, `join_date`, `member_name`, `plan`, `status`, `assigned_to`, `payment_status`, `last_attendance_date`, `onboarding_done`, `risk_level`, `follow_up_due`, `next_action`, `outcome_reason`, `folder_link`.

## Workflow inventory

| Workflow | Acceptance criteria | Edge cases |
|---|---|---|
| Visitor evaluates offer | User can move from homepage to Admin Systems to Admin HQ. | Mobile route access, old CTAs, stale cache. |
| Open sample system | User opens any `?demo=1` route and sees sample records if local storage is empty. | Existing local storage; empty state; six system routes. |
| Add/edit record | User opens modal, changes data, saves, and sees updated validation. | Blank required fields, long text, enum fields. |
| Find blocked work | User filters Blocked and sees failed record IDs and reasons. | Multiple flags; no blocked records. |
| Export/import records | User exports CSV, imports CSV, and row count/IDs survive. | Escaped commas/quotes/newlines. |
| Clear local records | User intentionally clears records after confirmation. | Cancel confirmation; empty local storage. |

## Sanitized production-scale data acceptance

The local production-scale fixture must create:

- 240 sanitized records per system.
- 1,440 total records across all six systems.
- no email-like data.
- no 13-digit SA-ID-like values.
- deterministic unique IDs.
- deterministic expected failures: 72 failed / 168 passed per system.
- CSV export/import round-trip preserving row count and first ID.

## Blocked items

A true live-browser clean pass is blocked until the latest GitHub commits are deployed and the public Vercel alias is refreshed.
