# TAD production wiring

Date: 2026-07-11

## Source of truth

```text
GitHub:  Buttercode-systems/TAD
Branch:  main
Vercel:  the-admin-department
Live:    https://the-admin-department.vercel.app
Supabase project reserved: rkehvxcrxiuqowdrldyr
```

The retired `TheRealButter/The-Admin-Department` path is not a source of truth.

## Current runtime architecture

TAD is currently a static browser application. The public site, Admin HQ and six admin systems are HTML, CSS and JavaScript deployed on Vercel.

Operational demo/pilot data is stored locally in the browser and can be imported or exported as CSV. The current codebase does not call Supabase, does not implement authentication and does not require database environment variables.

The Supabase project `rkehvxcrxiuqowdrldyr` is intentionally reserved for a future private, authenticated, multi-user backend. An empty database is therefore the correct state for the current runtime and must not be mistaken for a failed connection.

## Verification contract

`node tests/run-tests.mjs` verifies:

- all public and system routes exist
- all six systems load the shared engine and controller
- required controls and navigation links are present
- no placeholder contact email is published
- deterministic validation outcomes for sample data
- 240-record production-scale fixtures for every system
- CSV export/import round trips

GitHub Actions runs this suite on every pull request and push to `main`.

## Deployment rule

Only deployments produced from repository ID `1296727734` (`Buttercode-systems/TAD`) are authoritative. If Vercel metadata still shows the historical owner name while the repository ID and current content match, treat the stable repository ID as the identity and confirm the deployed commit before release.

## Backend activation gate

Do not connect real client data to the reserved Supabase project until all of the following exist:

- authenticated users and organisations
- tenant-scoped tables
- RLS policies and security tests
- encrypted secret handling
- audit logging
- data retention and deletion rules
- migration and rollback procedures

Until then, the product must continue to disclose that browser storage is local and that real client data belongs in a private approved workspace.
