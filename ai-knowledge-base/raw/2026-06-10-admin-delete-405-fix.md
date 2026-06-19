# Admin delete actions 405 — shared confirmDelete handler fix (2026-06-10)

**Symptom (user report):** "Oops! An Error Occurred — The server returned a 405 Method Not Allowed" when deleting users in the admin backend (prod, pro.beldify.com).

## Root cause

The shared delete handler in `public/js/my_admin_js.js` (`confirmDelete()`) finished the Swal confirm flow with:

```js
window.location.href = "/" + lang + "/delete-" + record + "/" + recordId;
```

— a plain **GET** navigation. Every `delete-*` route in `routes/web.php` is declared `Route::delete(...)` (e.g. `/delete-User/{id}` → `Admin\UserController@deleteUser`). 405 is raised at route matching (method mismatch), before any middleware. Because the handler is shared, **every admin table delete was broken**: users, customers, suppliers, stores, categories, stocks, branches, units, payment types, employees, variants, finance years, account heads/controls/sub-controls.

Secondary bugs found in the same path:

1. **Dishonest toast** — the success Swal ("Deleted!") fired *before* the request was even sent.
2. **Legacy attribute drift** — older account pages (`accountActivities`, `financeYears`, `accountHeads`, `accountSubControls`) and `salePage.js`-generated rows use bare `record=` / `recordId=` attributes, while the handler reads `data-record` / `data-record-id` → built `/delete-undefined/undefined` (404).
3. **Null crash** — `UserController::deleteUser` did `User::find($id)->delete()` → 500 on a stale/missing row.

## Fix (backend commit `2472c125`, branch feat/buyer-ai)

- `confirmDelete()` now sends `$.ajax({ type: "DELETE" })` with an **explicit** `X-CSRF-TOKEN` header read from the meta tag. Explicit because the admin layout loads `vendors.min.js` (jQuery) **twice** (footer + scripts_js) with a `noConflict()` dance — relying on the footer's `$.ajaxSetup` is fragile against that double-load.
- Success Swal only after 2xx, then `window.location.reload()`. Error Swal with ar/en messages for 403 (no permission), 419 (session expired), other (generic).
- Click handler falls back to legacy `record`/`recordId` attributes; bails silently if neither present.
- `User::findOrFail($id)` in deleteUser.
- `scripts_js.blade.php` include cache-busted: `?v={{ @filemtime(public_path('js/my_admin_js.js')) }}` — without this, prod browsers would keep executing the cached broken handler indefinitely.

## Tests — `tests/Feature/Admin/AdminUserDeleteTest.php` (3 green)

- `GET /delete-User/{id}` → **405** (pins the contract that caused the bug; also proves deletes must never be CSRF-able GETs).
- admin `DELETE` → redirect + row gone.
- non-admin `DELETE` → 403, row intact.

**Test-env gotcha:** in the CLI/test process `LaravelLocalization::setLocale()` returns null, so web routes register **without** the locale prefix (`/delete-User/{id}`, not `/ar/...`). But three middleware redirect un-prefixed paths to `/ar/...` (which doesn't exist in the test route table): the project's own `App\Http\Middleware\SetLocaleMiddleware` (in the `web` group — this is the one that actually fires first) plus mcamara's `LocaleSessionRedirect` and `LaravelLocalizationRedirectFilter`. Feature tests hitting non-named web routes must `withoutMiddleware([...those three...])`. GET-405 tests don't need it (405 precedes middleware).

## Pre-existing, NOT fixed here (QA debt wave)

`AdminSharedLayoutTest` — 5 failures present at HEAD with this fix stashed: the test file_get_contents's `header.blade.php` / `sidebar.blade.php` / `head.blade.php`, but the dashboard switched to `header-v3` / `sidebar-v3` partials. Stale test, needs repointing.

## Deploy

git-archive-over-ssh of the 3 runtime files → MyContabo `/var/local/beldify-monorepo/beldify-backend` (bind-mounted to container `/var/www/html`), `view:clear`, `docker restart beldify-backend`. Smokes: prod JS contains `type: "DELETE"`, GET delete-User → 405 / unauth DELETE → 419 (i.e. method now routes into middleware), hero-config 200, /api/products/featured 200, login 200, zero fresh log errors.

Related: [[beldify-admin-v3-components]], [[beldify-prod-deploy]], [[beldify-admin-locale-routing]]
