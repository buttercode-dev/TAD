# Permanent tests: what they are and why TAD keeps them

## Plain-English definition

A permanent test is a repeatable check stored in the repository and run automatically whenever important code changes. It is not a one-time manual test and it is not a production client record.

For TAD, the permanent suite creates a temporary, isolated Supabase stack, applies the database structure, creates synthetic users and workspaces, performs the operator/client workflow, saves evidence, and then destroys the temporary environment.

## Why TAD needs them

TAD is not only a brochure website. It makes operational promises about:

- secure application intake;
- operator-only Admin HQ access;
- client-only workspace access;
- six department workflows;
- owner/manager decisions;
- viewer read-only restrictions;
- cross-client separation;
- approvals and reports;
- repeatable onboarding.

A visual page can look correct while any one of those promises is broken underneath. Permanent tests catch regressions when a later code change accidentally removes a permission rule, breaks a route, changes a database function, or disconnects the TAD website from the authenticated service engine.

## What runs automatically

The current TAD checks cover five layers:

1. **Static verification** — required pages, copy, links and browser assets exist.
2. **Offer validation** — the six service offers and application rules stay internally consistent.
3. **Portal-entry verification** — Client Portal and Admin HQ routes continue to lead to the correct branded sign-in paths.
4. **Live public-entry browser checks** — the deployed website, service pages and public entry points render and remain reachable.
5. **Full role integration** — a temporary database is used to test applicant, operator, client manager, viewer, second client and outsider behaviour.

## What the full role test proves

The full role test currently proves that:

- all six department applications can be submitted;
- invalid departments are rejected;
- duplicate applications are recognised;
- an ordinary client cannot enter operator functions;
- an allowlisted operator can bootstrap Admin HQ access;
- qualified applications can create the correct department workspace;
- the primary client can claim only a workspace whose contact email matches their verified account email;
- a second client cannot see the first client's workspace;
- an outsider receives no workspace;
- a viewer can read but cannot approve or respond;
- a client manager can approve or reject a pending decision;
- a client manager can respond to a weekly report;
- the operator can see the client response;
- migrations can build a clean environment from zero.

## What permanent tests do not prove

They do not prove that:

- a real email provider will always deliver confirmation messages;
- a customer will supply clean or authorised records;
- the operator will follow the operating procedure correctly;
- a third-party service such as Vercel, Supabase, Gmail or a payment provider will never have downtime;
- the business outcome promised by the client will be achieved;
- every device, browser and network condition has been covered;
- manual external follow-up was actually sent.

Those areas require monitoring, operating checklists, real pilot evidence and incident procedures in addition to code tests.

## Do we really need the permanent tests?

**Yes.** TAD handles multiple client workspaces and role-based decisions. A regression could expose one client's data to another client or allow a viewer to make a decision. Those are high-trust failures. The tests are therefore a release gate, not decoration.

The correct rule is:

- keep the permanent tests;
- run them on pull requests and changes to `main`;
- never merge while a relevant test is red;
- keep test data synthetic and isolated;
- update tests when the product promise changes;
- do not treat a green test as a guarantee that outside services can never fail.

## Cost and safety

The suite uses GitHub Actions runner time and local Docker containers on the runner. It does not intentionally create production client records. It can consume free-tier CI minutes, so duplicate or low-value workflows should be consolidated over time, but the security and role-integration gate should remain.

## Release decision

A TAD release is acceptable only when:

- all repository checks are green;
- the migration replay is green;
- the full role integration is green;
- the public live-entry check is green;
- any copy describing a manual step clearly says it is manual;
- a human reviews any new payment, email, legal, clinical or banking-related behaviour.
