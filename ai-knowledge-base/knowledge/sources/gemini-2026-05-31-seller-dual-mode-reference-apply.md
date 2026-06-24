---
name: Gemini plan — seller dual-mode dashboard (reference apply)
description: Plan to apply Simple/Advanced seller dashboard reference UI — Alpine mode-switch dropdown, profile preferences, light home
type: source
sources: [raw/gemini/2026-05-31-seller-dual-mode-reference-apply.md]
created: 2026-06-03
updated: 2026-06-03
---

# Gemini plan — seller dual-mode dashboard (reference apply)

## Summary
A Gemini design-application plan to apply the dual-mode (Simple/Advanced) seller dashboard reference UI: replace the density toggle with an Alpine dropdown mode-switch, add a profile preferences section, and refine the light seller home.

## Key points
- **Mode-switch dropdown**: replace `dash-density-toggle` with an Alpine `x-data` dropdown before the messages/notifications icon; `tw-ms-auto` (RTL-aware); `data-dash-toggle="simple|complex"` ties into existing localStorage JS.
- **Profile preferences section** (`seller/profile/edit.blade.php`): `x-v3.section-card` explaining Simple vs Advanced with interactive selector buttons that live-toggle the mode.
- **Light seller home** (`seller/dashboard.blade.php`): soft white cards, flexbox order rows with avatar chips, end-aligned timestamps, `tw-font-mono` order numbers.
- **New i18n keys**: `simple_mode`, `advanced_mode`, `whats_the_difference`, `dashboard_preferences`, `dashboard_mode_explanation`, `simple_mode_desc`, `advanced_mode_desc`.

## See also
- [[concepts/dual-mode-seller-dashboard]]
- [[concepts/seller-shell-layout]]
- [[concepts/beldify-admin-v3-component-library]]
