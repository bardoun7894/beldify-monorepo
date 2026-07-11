---
name: specs/fix-admin-i18n/research.md
description: Auto-synced from specs/fix-admin-i18n/research.md
type: source
sync_origin: specs/fix-admin-i18n/research.md
sync_hash: f7e9262d9f87fb1a
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/fix-admin-i18n/research.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Research — Admin Dashboard i18n Fix

## KB prior art

- [[i18n t() Fallback vs Locale Value]] — add-key-but-skip-template split-completion anti-pattern
- [[Admin Dashboard Atlas Polish (2026-05-31)]] — fixed page header eyebrow/subtitle but missed supplementary KPI cards

## Verified key inventory (2026-06-27)

### Category A — Keys exist, templates not wired (16 keys in en/ar/fr)

All ADMIN1 keys were bulk-added on 2026-06-10 to all 3 locales.

| Key | EN | AR | FR |
|---|---|---|---|
| `overview` | Overview | نظرة عامة | Aperçu |
| `admin_dashboard_subtitle` | High-level... | تحليلات الإيرادات... | Analyses des revenus... |
| `last_30_days_caption` | LAST 30 DAYS | آخر 30 يومًا | 30 DERNIERS JOURS |
| `store_requests` | Store Requests | طلبات المتاجر | MISSING (only store_requests_kpi exists) |
| `review_moderation` | Review Moderation | إشراف على التقييمات | Modération des avis |
| `community_moderation` | Community Moderation | إشراف على المجتمع | Modération de la communauté |
| `payment_proofs` | Payment Proofs | إثباتات الدفع | Preuves de paiement |
| `awaiting_verification` | Awaiting verification | في انتظار التحقق | En attente de vérification |
| `store_requests_kpi` | Store Requests | طلبات المتاجر | Demandes de boutiques |
| `awaiting_admin_approval` | Awaiting admin approval | في انتظار موافقة المشرف | En attente d'approbation |
| `return_requests` | Return Requests | طلبات الإرجاع | Demandes de retour |
| `needs_resolution` | Needs resolution | يحتاج إلى حل | À résoudre |
| `contact_messages` | Contact Messages | رسائل التواصل | Messages de contact |
| `new_contact_inquiries` | New contact inquiries | استفسارات تواصل جديدة | Nouvelles demandes |
| `no_store_performance_data` | No store performance data yet | لا توجد بيانات أداء | Aucune donnée |
| `pending` | Pending | قيد الانتظار | En attente |
| `open` | Open | مفتوح | Ouvert |
| `unread` | unread | غير مقروء | unread |
| `open_souk` | Open Souk | N/A (check) | Souk Ouvert |
| `view_all` | View All | N/A (check) | Voir tout |

### Category B — Missing keys (8 new keys needed for all 3 locales)

| Key | EN |
|---|---|
| `souk_briefs_open` | `{0} No open briefs\|{1} 1 open\|[2,*] :count open` |
| `dashboard_empty_orders_title` | The atelier is restocking |
| `dashboard_empty_orders_sub` | No orders yet — share your first brief in the Open Souk. |
| `open_souk_briefs` | Open Souk Briefs |
| `dashboard_empty_souk_title` | The souk awaits its first brief |
| `dashboard_empty_souk_sub` | No community briefs yet — invite artisans to post. |
| `post_a_brief` | Post a brief |
| `souk_budget_tbd` | Budget TBD |

### Additional fix: `store_requests` key missing from fr/messages.php

### Category C — Stale files

- `resources/views/admin/dashboard/content.blade.php` — Bootstrap 4, fake data, 0 route refs
- `app/Http/Controllers/DashboardStyleController.php` — dead controller, loads content.blade.php

## Fix plan

See `specs/_session/2026-06-27-tasks.md` for task list.

