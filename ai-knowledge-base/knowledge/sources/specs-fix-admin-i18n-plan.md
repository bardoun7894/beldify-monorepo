---
name: specs/fix-admin-i18n/plan.md
description: Auto-synced from specs/fix-admin-i18n/plan.md
type: source
sync_origin: specs/fix-admin-i18n/plan.md
sync_hash: 21e6f7dc508de97f
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/fix-admin-i18n/plan.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Plan — Fix Admin Dashboard Hardcoded i18n Strings

## Summary

Wire 16 existing ADMIN1 translation keys to Blade templates, add 8 missing keys to all 3 locales (ar/en/fr), add missing `store_requests` to fr, delete 2 stale files.

## Steps

### Step 1: Category A — Wire existing keys to index.blade.php (19 edits)

Replace hardcoded English strings with `{{ __('messages.KEY') }}` or `{{ __('messages.KEY') }}` calls.

### Step 2: Category A+ — Wire to kpi-tiles.blade.php (2 edits)

Replace `Open Souk` with `{{ __('messages.open_souk') }}` and use `trans_choice` for open briefs badge.

### Step 3: Category A+B — Wire to recent-activity.blade.php (9 edits)

Replace all hardcoded strings (View all, empty states, panel titles, budget TBD).

### Step 4: Category B — Add 8 new keys to en/messages.php

After `last_30_days_caption` (line 1970): `souk_briefs_open` through `souk_budget_tbd`.

### Step 5: Category B — Add 8 new keys to ar/messages.php

After `last_30_days_caption` (line 1739), with Arabic translations.

### Step 6: Category B — Add 8 new keys to fr/messages.php + `store_requests`

After `last_30_days_caption` (line 842), with French translations. Also add `store_requests => 'Demandes de boutiques'`.

### Step 7: Category C — Delete stale files

Remove `content.blade.php` and `DashboardStyleController.php`.

## Risk: None. Pure i18n string replacement, no logic changes

