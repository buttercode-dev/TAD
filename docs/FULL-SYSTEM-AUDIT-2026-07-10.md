# Full System Audit — 2026-07-10

## Scope audited

This pass audited the current repository surfaces for The Admin Department / Admin HQ after the six-system expansion and DueToday-scale visual correction.

Audited surfaces:

- `index.html`
- `styles.css`
- `admin-systems.html`
- `admin-systems.css`
- `app/index.html`
- `app/assets/app.css`
- `app/assets/app.js`
- `app/assets/engine.js`
- `app/invoice-admin/index.html`
- `app/sales-admin/index.html`
- `app/client-admin/index.html`
- `app/property-admin/index.html`
- `app/practice-admin/index.html`
- `app/member-admin/index.html`
- `tests/run-tests.mjs`
- `tests/fixtures/sanitized-production-scale-data.mjs`
- QA/test-result docs where relevant

## What was fixed in this audit pass

### FIX-001 — Regression runner did not enforce page contracts

Before this pass, `tests/run-tests.mjs` checked route file existence and engine behavior, but did not verify that each page actually contained the required browser app contract.

Added checks for:

- public route files exist
- public pages do not contain `hello@example.com`
- public pages do not use old `Open demo` wording
- homepage links to every system sample route
- Admin Systems page links to every system sample route
- Admin HQ launcher links to every system sample and empty route
- every app page has the correct `data-system`
- every app page loads shared `app.css`
- every app page loads shared `engine.js`
- every app page loads shared `app.js`
- every app page contains all required UI IDs
- every app page navigation links to all six systems
- CSS does not reintroduce known oversized values from the pre-DueToday-scale pass

### FIX-002 — Scale regression protection added

Added test assertions to prevent the old oversized values from coming back:

- `108px`
- `112px`
- `100px`
- `8.5vw`
- `min-height:460px`
- `min-height:330px`

These were the values that made the interface feel zoomed in compared with DueToday.

## Current confirmed structure

### Public pages

`index.html` and `admin-systems.html` both link to the six live system sample routes:

- `app/invoice-admin/?demo=1`
- `app/sales-admin/?demo=1`
- `app/client-admin/?demo=1`
- `app/property-admin/?demo=1`
- `app/practice-admin/?demo=1`
- `app/member-admin/?demo=1`

### App pages

All six app pages follow the same required contract:

- `data-system`
- shared app CSS
- shared rules engine
- shared browser controller
- add record button
- load sample data button
- export CSV button
- import CSV input
- clear button
- metrics containers
- table container
- report grid
- blocked list
- record modal
- record form
- cancel/save controls
- top navigation to all six systems

## Engine audit notes

### PASS — Six systems exist in the shared engine

The shared engine defines:

- invoice
- sales
- client
- property
- practice
- member

Each system has:

- labels
- storage key
- ID key
- statuses
- editable field definitions
- sample data
- validation logic
- report logic

### RISK-001 — Fixed engine date

The engine currently defines a fixed date:

```js
var TODAY = '2026-07-10';
```

This is useful for deterministic demo/test behavior, but it is a live-product mismatch. In a production-like browser app, due-soon, overdue, stale-new and attendance-gap logic should move with the real current date or use an explicit visible demo clock.

Recommended fix:

- Add a `today()` helper that uses the browser's local date in live usage.
- Keep test determinism by passing an explicit `today` argument from `tests/run-tests.mjs`.
- Add regression tests proving both deterministic test date and live date override behavior.

Status: not patched in this pass because the shared engine is large and connector output was truncated. A blind full-engine rewrite would risk breaking validated behavior.

### RISK-002 — Public sample data uses realistic human/business names

The production-scale fixture is sanitized, but the public demo sample data still contains realistic names and business names.

This is not production data, but the safer future direction is to make all public sample records visibly synthetic, for example:

- `Demo Supplier 001`
- `Demo Lead 001`
- `Demo Client 001`
- `Demo Tenant 001`
- `Demo Patient 001`
- `Demo Member 001`

Status: not patched in this pass because changing all samples also requires updating user-facing screenshots, QA expectations and possibly demo copy.

## Controller audit notes

### PASS — Shared controller is coherent

`app/assets/app.js` handles:

- system detection from `data-system`
- per-system localStorage
- sample loading through `?demo=1`
- add/edit modal generation from engine field definitions
- search
- filter chips
- table rendering
- mobile card rendering
- blocked queue
- CSV export
- CSV import
- clear confirmation
- toast feedback

### RISK-003 — No invalid-system guard

If a page accidentally ships with an unsupported `data-system`, the controller will fail when reading `config.storageKey`.

Recommended fix:

- Add a small guard after `config = E.systems[system]`.
- Render a visible error state rather than throwing.

Status: logged, not urgent because the page-contract tests now assert valid `data-system` values for the six shipped routes.

### RISK-004 — CSV import has no schema warning

CSV import accepts whatever headers are present and renders records. Missing required headers become empty values and validation catches some of this, but the UI does not warn the user that the file schema is incomplete.

Recommended fix:

- Add an import validation step that compares CSV headers against `config.fields`.
- Show a toast/warning before accepting incomplete imports.

Status: logged for next interaction-hardening pass.

## Page/content audit notes

### PASS — Six-system positioning is consistent on Admin Systems page

The Admin Systems page uses six-system language, shows all six systems, and routes all system CTAs into the working app.

### PASS — Homepage routes are aligned

The homepage department cards route to all six sample systems.

### RISK-005 — Homepage hero is intentionally less explicit than Admin Systems page

The homepage still has broader copy and does not name every workflow in the hero sentence. This is acceptable for a cleaner first impression, but if users miss that six systems exist, use Admin Systems page as the detailed offer page.

Status: intentional; no fix.

### RISK-006 — App orb still says `Gate 2 tested`

The app CSS badge still says `Gate 2 tested`. Since the product now has six live systems, this is not wrong historically, but it is stale as a public-facing badge.

Recommended replacement:

- `Live validation`
- `Six systems`
- `Local demo`

Status: logged; not patched in this pass to avoid another broad CSS rewrite after scale correction.

## Test coverage now includes

The updated test runner validates:

- route files
- public page links
- no placeholder email
- no old demo-first wording
- app page contracts
- required UI IDs
- all six system navigation links
- no old oversized CSS values
- engine definitions
- sample validation results
- expected blocked records
- report totals
- CSV round-trip
- sanitized production-scale fixture
- unique production-scale IDs
- production-scale deterministic failures
- production-scale report counts

## Remaining blocked verification

A clean, final pass still needs execution in an environment with a fresh checkout or CI:

```bash
NODE_ENV=production node tests/run-tests.mjs
```

Expected result after the latest test update:

```text
All Admin HQ inventory, page-contract, scale, and production-scale regression tests passed.
```

A browser-level QA pass is still needed for:

- JavaScript execution in the live browser
- localStorage behavior
- `?demo=1` sample rendering
- search/filter interaction
- add/edit modal behavior
- CSV download
- CSV upload
- mobile visual rendering
- keyboard/focus behavior

## Audit verdict

Repo-side structure is coherent after fixes. The largest remaining product risk is the fixed engine date. The largest remaining QA gap is browser-level interaction testing.
