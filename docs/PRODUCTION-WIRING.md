# TAD production wiring

Date updated: 2026-07-13

## Sources of truth

```text
Public website and workflow previews
GitHub:  Buttercode-systems/TAD
Branch:  main
Vercel:  the-admin-department
Live:    https://the-admin-department.vercel.app

Authenticated managed-service engine
GitHub:  Buttercode-systems/DTC
Branch:  main
Vercel:  due-today-six
Live:    https://due-today-six.vercel.app
```

The retired `TheRealButter/The-Admin-Department` path is not a source of truth.

## Current runtime architecture

TAD now has a split architecture.

### Public TAD repository

`Buttercode-systems/TAD` contains:

- the public marketing website;
- the Admin Audit browser diagnostic;
- six paid service pages;
- six public workflow previews;
- the Client Portal redirect entry;
- the Admin HQ redirect entry;
- public static regression tests;
- the full cross-repository role-integration test.

The public workflow previews remain browser-only sample systems. They are not the production client database and must not be used for confidential client records.

### Authenticated service engine

`Buttercode-systems/DTC` contains the authenticated operational layer used by TAD:

- Supabase authentication;
- operator allowlisting and Admin HQ access;
- private application intake;
- tenant-scoped managed workspaces;
- six department workflow templates;
- client memberships and role checks;
- verified-email Client Portal activation;
- approvals;
- reports;
- audit events;
- database migrations and RLS rules.

TAD public entry routes redirect as follows:

```text
/portal/ -> https://due-today-six.vercel.app/portal
/ops/    -> https://due-today-six.vercel.app/hq
```

## Data boundary

- Public readiness forms contain business-level facts only.
- The Admin Audit does not automatically transmit or persist answers.
- Public workflow previews use local browser data and sample records.
- Real managed client records belong only in the authenticated managed workspace after authority, scope and payment are confirmed.
- Practice / Booking Admin remains non-clinical. Patient clinical information must not be loaded.

## Verification contract

### TAD static regression

`node tests/run-tests.mjs` verifies:

- all public and preview routes exist;
- all six preview systems load the shared engine and controller;
- required controls and navigation links are present;
- no placeholder contact email is published;
- deterministic sample validation outcomes;
- 240-record synthetic scale fixtures for every preview system;
- CSV export/import round trips;
- Admin Audit safety boundaries.

### Portal-entry regression

Dedicated checks verify that Client Portal and Admin HQ public entry routes remain branded and point to the authenticated engine.

### Live browser regression

The deployed TAD website, six offers, workflow previews and authenticated entry points are exercised in Chromium.

### Full operator/client integration

The TAD role-integration workflow checks out the authenticated engine, creates an isolated local Supabase stack, applies every migration and tests:

- all six applications;
- invalid and duplicate intake;
- operator bootstrap;
- qualification and onboarding;
- correct department workspace creation;
- verified-email client access;
- client-to-client isolation;
- outsider denial;
- viewer read-only behaviour;
- workflow creation;
- approvals;
- reports and client responses.

The temporary stack is destroyed after the run. No real production client record is intentionally created by this test.

## Deployment rule

Only deployments produced from the current `Buttercode-systems/TAD` and `Buttercode-systems/DTC` repositories are authoritative. Before release, confirm:

- the deployed commit matches the merged commit;
- all relevant GitHub checks are green;
- the authenticated engine migration set is green;
- the full role integration is green;
- the public live-entry browser check is green.

## Operational limitations that remain manual

The current product does not automatically perform:

- payment collection;
- contract acceptance;
- activation-email delivery from Admin HQ;
- real-record cleanup and import for every department;
- external WhatsApp or email sending;
- weekly report scheduling;
- client offboarding and retention decisions.

Those are controlled operator procedures described in `docs/TAD-OPERATING-MANUAL.md` and must not be represented as automatic.

## Security rule

A green test suite reduces risk but cannot guarantee that third-party providers, human operators or client email accounts will never fail. Production use also requires monitoring, incident handling, access reviews, retention rules and human supervision.
