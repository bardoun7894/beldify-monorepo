---
name: Beldify Admin V3 Component Library
description: "Reusable Blade components for the Beldify admin V3 design — page-header, kpi-tile, badge, avatar, btn, data-table, empty-row, section-card, form-row, input, toggle, search-input; 128 pages ported across 3 waves"
type: concept
tags: [php, blade, migration, request, route, tailwind, component, cart, order, pattern]
sources: [daily/2026-05-23.md, daily/2026-05-24.md, daily/2026-05-28.md]
created: "2026-05-23"
updated: "2026-05-28"
---
# Beldify Admin V3 Component Library

## Overview
A set of reusable Blade components in `resources/views/components/v3/` that encode the Beldify Atlas design language for admin pages. Any admin page can be ported to the V3 design in ~10 minutes using these components. All components use the `tw-` prefixed Tailwind utilities, Atlas Indigo/Saffron Amber tokens, and Playfair Display / Inter typography from `DESIGN.md`.

## Key Points
- All components live under `resources/views/components/v3/` — referenced as `<x-v3.component-name>`
- Components use `tw-` prefixed Tailwind classes to avoid collision with Bootstrap styles still present on legacy admin pages
- The page recipe (page-header + kpi-tile grid + data-table) reduces any list page to ~36 lines of Blade
- Form pages use `section-card` + `form-row` + `input` / `toggle`
- **Never use inline `tw-*` classes where a component exists** — single source of truth prevents palette drift

## Details

### Component catalog

#### `<x-v3.page-header>` — Editorial page banner
```blade
<x-v3.page-header
    eyebrow="{{ __('Commerce') }}"
    icon="la la-file-invoice"
    title="{{ __('messages.all_orders') }}"
    subtitle="All orders across stores and channels.">
    <x-slot name="actions">
        <x-v3.btn href="{{ route('admin.orders.export') }}" icon="la la-download" variant="primary">Export</x-v3.btn>
    </x-slot>
</x-v3.page-header>
```
Renders: indigo-900 gradient banner with amber radial glow, Playfair Display title, uppercase eyebrow + Line Awesome icon, action pills slot.

#### `<x-v3.kpi-tile>` — Stat card
```blade
<x-v3.kpi-tile tint="amber" label="{{ __('messages.total_carts') }}" :value="$totalCarts" icon="la la-shopping-cart" />
<x-v3.kpi-tile tint="emerald" label="Active" :value="$activeCarts" icon="la la-circle" />
<x-v3.kpi-tile tint="rose" label="Abandoned" :value="$abandonedCarts" icon="la la-exclamation-circle" />
<x-v3.kpi-tile tint="indigo" label="Completed" :value="$completedCarts" icon="la la-check-circle" />
```
Props: `tint` (amber/emerald/rose/indigo/slate), `label`, `:value`, `icon`. Renders: 2-column → 4-column responsive grid card with tinted icon bubble.

#### `<x-v3.badge>` — Pill badge
```blade
<x-v3.badge tint="emerald">{{ __('messages.active') }}</x-v3.badge>
<x-v3.badge tint="rose">{{ __('messages.abandoned') }}</x-v3.badge>
```
Props: `tint` (same 5 variants). Renders: `rounded-full` pill with semantic background + text color.

#### `<x-v3.avatar>` — Customer avatar
```blade
<x-v3.avatar :name="$order->user->name" :email="$order->user->email" />
```
Renders: indigo→amber gradient circle with initial letter + name + email in a flex column.

#### `<x-v3.btn>` — Pill button / link
```blade
<x-v3.btn href="{{ route('admin.carts.show', $cart->id) }}" icon="la la-eye" variant="indigo" size="sm">View</x-v3.btn>
<x-v3.btn href="{{ route('admin.carts.destroy', $cart->id) }}" icon="la la-trash" variant="danger" size="sm">Delete</x-v3.btn>
```
Props: `href` (renders `<a>`; omit for `<button>`), `icon`, `variant` (primary/soft/ghost/danger/indigo), `size` (sm/md). All variants use `rounded-full`.

#### `<x-v3.data-table>` — Table wrapper card
```blade
<x-v3.data-table :columns="[__('messages.id'), __('messages.customer'), __('messages.status'), '']">
    <x-slot name="toolbar">
        <input type="text" placeholder="{{ __('messages.search_carts') }}" class="bdv3-search-pill" />
        <x-v3.btn type="submit" variant="primary" icon="la la-filter">{{ __('messages.apply') }}</x-v3.btn>
    </x-slot>
    @forelse ($carts as $cart)
        <tr class="hover:tw-bg-amber-50/40 tw-transition tw-text-slate-700">
            <td class="tw-px-5 tw-py-3">#{{ $cart->id }}</td>
            …
        </tr>
    @empty
        <x-v3.empty-row :colspan="5" title="{{ __('messages.no_data') }}" subtitle="Carts will appear here." />
    @endforelse
    @if($carts->hasPages())
        <x-slot name="footer">{{ $carts->links() }}</x-slot>
    @endif
</x-v3.data-table>
```

#### `<x-v3.empty-row>` — Table empty state
Props: `:colspan`, `title`, `subtitle`. Renders: basket icon + Playfair title + microcopy centered in a full-width table row.

#### `<x-v3.section-card>` — Form/analytics section card
```blade
<x-v3.section-card title="{{ __('messages.general_settings') }}" meta="Configure cart behavior">
    <x-v3.form-row label="Cart Timeout" name="cart_timeout" help="Minutes before cart expires">
        <x-v3.input name="cart_timeout" :value="old('cart_timeout', $settings->cart_timeout)" type="number" />
    </x-v3.form-row>
    <x-v3.toggle name="send_notifications" :checked="$settings->send_notifications" label="Send abandoned cart notifications" description="Email sellers when a cart is abandoned" />
</x-v3.section-card>
```

#### `<x-v3.form-row>` — Form field with label and error
Auto-binds to `$errors->get($name)`. Renders the field label, help text, field slot, and error message in a consistent layout.

#### `<x-v3.input>` — Text/number input
Props: `name`, `:value`, `type`, `placeholder`. Styled as amber-focus `rounded-xl` input matching the atlas input style.

#### `<x-v3.toggle>` — Amber checkbox switch
Props: `name`, `:checked`, `label`, `description`. Renders: custom amber-styled switch using a hidden checkbox + styled `<label>`.

#### `<x-v3.search-input>` — Flex icon+input search bar *(added 2026-05-24)*
```blade
<x-v3.search-input name="search" :value="request('search')" placeholder="{{ __('messages.search') }}" />
```
Renders: flex row with a search icon on the left and a text input filling the remaining space. Replaces the broken `tw-px-10` absolute-positioning pattern where the icon overlapped the input placeholder on narrow screens.

**Why this component exists:** the previous pattern used `position: relative` on the wrapper + `position: absolute; left: 0` on the icon + `padding-left: 2.5rem` on the input. This broke when the icon and text shared the same containing block width. The flex approach is simpler and RTL-safe.

**Deployment (2026-05-24):** applied via `perl -0777 -i -pe` to 11 table files across the V3 admin surface. Files: categories, orders, carts, stock, stores, community posts, affiliates, commissions, products, tailoring-orders, open-souk.

### Canonical page recipe (list page)

```blade
@extends('admin.dashboard')
@section('content')
<div class="container-fluid bdv3-page">
    <x-v3.page-header eyebrow="COMMERCE" icon="la la-file-invoice" title="All Orders" subtitle="…">
        <x-slot name="actions">
            <x-v3.btn href="…" icon="…" variant="primary">Export</x-v3.btn>
        </x-slot>
    </x-v3.page-header>

    <div class="tw-grid tw-grid-cols-2 lg:tw-grid-cols-5 tw-gap-3 tw-mb-5">
        <x-v3.kpi-tile tint="amber" label="Total" :value="$total" icon="la la-file" />
        {{-- ... more tiles --}}
    </div>

    <x-v3.data-table :columns="[__('ID'), __('Customer'), __('Status'), '']">
        <x-slot name="toolbar">… filters …</x-slot>
        @forelse ($items as $item)
            <tr class="hover:tw-bg-amber-50/40 tw-transition tw-text-slate-700">
                …
            </tr>
        @empty
            <x-v3.empty-row :colspan="4" title="No data" subtitle="Items will appear here." />
        @endforelse
        @if($items->hasPages())
            <x-slot name="footer">{{ $items->links() }}</x-slot>
        @endif
    </x-v3.data-table>
</div>
@endsection
```

### Pages already ported (as of 2026-05-23)
| Admin route | Blade file | Components used |
|-------------|-----------|----------------|
| `/admin/carts` | `carts/index.blade.php` | page-header, kpi-tile×4, data-table, badge, avatar, btn, empty-row |
| `/admin/carts/abandoned` | `carts/abandoned.blade.php` | page-header, data-table, badge, btn |
| `/admin/carts/analytics` | `carts/analytics.blade.php` | page-header, kpi-tile×3, section-card×3 |
| `/admin/carts/settings` | `carts/settings.blade.php` | page-header, section-card, form-row, input, toggle, btn |
| `/admin/orders` | `orders/index.blade.php` | page-header, kpi-tile×5, data-table, badge, avatar, btn, empty-row |
| `/admin/orders/analytics` | `orders/analytics.blade.php` | page-header, kpi-tile×3, section-card×3, data-table |
| `/admin/orders/settings` | `orders/settings.blade.php` | page-header, section-card, form-row, input, toggle, btn |
| `/allPurchases` | `includes/purchases/allPurchases.blade.php` | page-header, btn (legacy table preserved) |
| `/purchaseInvoices` | `includes/purchases/purchases.blade.php` | page-header (surgical swap) |
| `/purchasePaymentPending` | `includes/purchases/pending_purchases.blade.php` | page-header, btn |
| `/purchaseReturns` | `includes/purchaseReturns/purchaseReturns.blade.php` | page-header, section-card, form-row, input, btn |

## Mass refactor via parallel agent waves (2026-05-28)

After orders page was confirmed working, three waves of parallel agents ported all remaining admin pages:

### Wave 1 — orders cluster (1 page)
- `orders/index.blade.php` — verified working; used as template for subsequent waves

### Wave 2 — 17 pages, 4 parallel agents
Each agent handled a cluster:
- **Agent A**: catalog cluster (categories, products, brands, attributes) — ~4 pages
- **Agent B**: marketplace cluster (stores, products listings, reviews) — ~4 pages
- **Agent C**: users/customers cluster — ~5 pages
- **Agent D**: finance/commissions cluster — ~4 pages

### Wave 3 — 90 form/CRUD pages, 5 parallel agents
The largest sweep:
- **Agent A**: all create/edit forms (tailoring, catalog)
- **Agent B**: settings and configuration pages
- **Agent C**: analytics and report views
- **Agent D**: moderation and community views
- **Agent E**: remaining listing/show pages

**Total ported: 128 admin pages** (1 + 17 + 90 = Wave 1 + Wave 2 + Wave 3, with remainder).

### Porting approach per page
Each agent followed the canonical recipe:
1. Replace `@extends` target with `admin.dashboard` (has `bdv3-shell` body class wired from 2026-05-28)
2. Swap old `<div class="content-header">` + Bootstrap grid with `<x-v3.page-header>`
3. Wrap table in `<x-v3.section-card>` or `<x-v3.data-table>`
4. Replace stat boxes with `<x-v3.kpi-tile>` grid
5. Wrap forms in `<x-v3.section-card>` + `<x-v3.form-row>` + `<x-v3.input>`

## Related Concepts
- [[concepts/beldify-admin-v3-sidebar]] — The sidebar that all ported pages plug into
- [[concepts/atlas-design-system]] — Design tokens these components encode (Atlas Indigo, Saffron Amber, 12px border-radius, Playfair Display)
- [[concepts/admin-atlas-migration]] — Broader migration context; component library is the accelerant
- [[concepts/tailwind-jit-dynamic-class-pitfalls]] — Pitfalls to avoid when using `tw-*` classes in Blade (no dynamic construction, no `@apply` in templates)

## Sources
- [[daily/2026-05-23.md]] — Full component library built; all 11 components defined; 11 admin pages ported; canonical recipe established
- [[daily/2026-05-24.md]] — `x-v3.search-input` component added; deployed to 11 table files via perl one-liner
- [[daily/2026-05-28.md]] — Wave 1 (orders, 1 page), Wave 2 (17 pages, 4 agents), Wave 3 (90 pages, 5 agents); total 128 pages ported to V3 components
