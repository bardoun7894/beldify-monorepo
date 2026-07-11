---
name: specs/fix-admin-i18n/tasks.md
description: Auto-synced from specs/fix-admin-i18n/tasks.md
type: source
sync_origin: specs/fix-admin-i18n/tasks.md
sync_hash: 3e6244a7c6e08059
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/fix-admin-i18n/tasks.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Tasks — Fix Admin Dashboard Hardcoded i18n Strings

## task-001: Wire Category A keys to index.blade.php

**Status:** in-progress
**Files:** `beldify-backend/resources/views/admin/dashboard/index.blade.php`
**Changes:** 19 hardcoded string replacements in the dashboard index view.

## task-002: Wire keys to kpi-tiles.blade.php

**Status:** pending
**Files:** `beldify-backend/resources/views/admin/dashboard/widgets/kpi-tiles.blade.php`
**Changes:** 2 replacements (open_souk + souk_briefs_open trans_choice).

## task-003: Wire keys to recent-activity.blade.php

**Status:** pending
**Files:** `beldify-backend/resources/views/admin/dashboard/widgets/recent-activity.blade.php`
**Changes:** 9 replacements (view_all x2, empty states x4, souk panel title, post_a_brief, budget_tbd).

## task-004: Add 8 Category B keys to en/messages.php

**Status:** pending
**Files:** `beldify-backend/resources/lang/en/messages.php`

## task-005: Add 8 Category B keys to ar/messages.php

**Status:** pending
**Files:** `beldify-backend/resources/lang/ar/messages.php`

## task-006: Add 9 keys to fr/messages.php (8B + store_requests)

**Status:** pending
**Files:** `beldify-backend/resources/lang/fr/messages.php`

## task-007: Delete stale files

**Status:** pending
**Files:** `content.blade.php`, `DashboardStyleController.php`

