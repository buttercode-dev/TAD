# Live QA Run — 2026-07-10

## Environment

Live alias tested:

```text
https://the-admin-department-7ruk.vercel.app/
```

## Guardrails

No production data was used. No destructive actions were performed. No production write/deploy action was triggered from this run.

This was a live read-only QA pass using Vercel route and asset fetches.

## Live route checks

| Route | Result | Notes |
|---|---:|---|
| `/` | 200 OK | Homepage shows six systems and live system links. |
| `/admin-systems.html` | 200 OK | Product page shows six working systems and live CTAs. |
| `/app/` | 200 OK | Admin HQ launcher shows all six systems. |
| `/app/invoice-admin/?demo=1` | 200 OK | Page loads with six-system nav and shared assets. |
| `/app/sales-admin/?demo=1` | 200 OK | Page loads with six-system nav and shared assets. |
| `/app/client-admin/?demo=1` | 200 OK | Page loads with six-system nav and shared assets. |
| `/app/property-admin/?demo=1` | 200 OK | Page loads with six-system nav and shared assets. |
| `/app/practice-admin/?demo=1` | 200 OK | Page loads with six-system nav and shared assets. |
| `/app/member-admin/?demo=1` | 200 OK | Page loads with six-system nav and shared assets. |
| `/app/assets/engine.js` | 200 OK | Live engine contains all six systems. |
| `/app/assets/app.js` | 200 OK | Live controller contains all six system subtitles and shared UI interactions. |

## Live deployment health

Latest checked production deployment:

```text
dpl_66xXu4YekwG3N5x5kg5zZ5DTNvWb
```

Status:

```text
READY
```

Build log error filter result:

```text
Build Completed in /vercel/output [100ms]
```

Runtime error check for the last hour:

```text
No runtime errors found in the selected time range.
```

## Findings

### PASS-001 — Public alias is refreshed

The public alias is no longer stale for the user-facing app surface. It shows the six-system homepage, six-system Admin Systems page, and six-system Admin HQ launcher.

### PASS-002 — Six working system routes are live

All six `?demo=1` routes returned 200 OK.

### PASS-003 — Shared live assets are reachable

Both core live assets returned 200 OK:

- `app/assets/engine.js`
- `app/assets/app.js`

### PASS-004 — No runtime errors surfaced from Vercel observability

No grouped runtime errors were returned for the last hour.

## Remaining limitations

This pass did not use a real browser automation engine, so the following still need browser-level QA:

- JavaScript execution after page load
- localStorage write/read behavior
- actual sample data rendering in the DOM
- button clicks
- modal open/close and save
- CSV export download
- CSV import file handling
- mobile viewport visual rendering
- keyboard/focus behavior

## Current status

Live route and asset pass: **clean**.

Full live user-interaction pass: **blocked handoff** until browser automation or manual browser QA is run.

## Recommended next step

Run a browser-level QA pass against the live alias using Playwright/Cypress/manual QA:

1. Clear localStorage.
2. Open each `?demo=1` route.
3. Confirm 10 records render.
4. Confirm metrics show 10 total, 7 passed, 3 blocked.
5. Use search/filter.
6. Open edit modal.
7. Save a change.
8. Export CSV.
9. Import CSV.
10. Confirm mobile cards render correctly under mobile width.
