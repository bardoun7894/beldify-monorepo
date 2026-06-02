---
name: Seller Shell Layout
description: Dedicated mobile-first seller dashboard layout with 5-tab bottom nav and desktop horizontal pill nav — separate from the admin shell, no PixInvent, RTL-aware, iOS safe-area aware
type: concept
sources: [daily/2026-05-24.md]
created: 2026-05-24
updated: 2026-06-01
---

# Seller Shell Layout

## Overview
Sellers were originally served the full 17-item V3 admin sidebar — an admin-centric interface they don't need and can't navigate. The seller shell is a completely separate layout (`layouts/seller_shell.blade.php`) that gives sellers a mobile-first 5-tab bottom navigation and a desktop horizontal pill nav, with no PixInvent dependency, full RTL support via logical CSS properties, and iOS safe-area handling.

## Key Points
- **Mobile**: 5-tab sticky bottom bar (Home / Orders / Products / Open Souk / Messages) with active-state amber underline
- **Desktop**: horizontal pill nav in a white top bar (replaces the bottom bar above 768px)
- **CSS file**: `public/css/seller-shell.css` (~7 KB) — Atlas tokens only, no Bootstrap, no PixInvent classes
- **RTL**: `inset-inline-*`, `padding-inline-*` throughout — no physical `left`/`right`
- **iOS safe area**: bottom nav padded with `env(safe-area-inset-bottom)` to avoid home-indicator overlap
- **No PixInvent conflict**: layout never loads PixInvent's CSS/JS; `bdvs-` class prefix (Beldify Vendor Seller) isolates all styles

## Details

### Layout structure
```blade
{{-- layouts/seller_shell.blade.php --}}
<body class="bdvs-shell">
    {{-- Desktop pill nav (hidden below 768px) --}}
    <nav class="bdvs-desktop-nav">
        <a href="{{ route('seller.dashboard') }}" class="bdvs-pill {{ request()->routeIs('seller.dashboard') ? 'bdvs-pill--active' : '' }}">
            @lang('messages.home')
        </a>
        {{-- ... 4 more pills --}}
    </nav>

    {{-- Page content --}}
    <main class="bdvs-content">
        @yield('content')
    </main>

    {{-- Mobile bottom bar (hidden above 768px) --}}
    <nav class="bdvs-bottom-nav">
        <a href="{{ route('seller.dashboard') }}" class="bdvs-tab">
            <svg>...</svg>
            <span>@lang('messages.home')</span>
        </a>
        {{-- ... 4 more tabs --}}
    </nav>
</body>
```

### CSS architecture
```css
/* seller-shell.css — key excerpts */
.bdvs-shell {
    --bdvs-primary: var(--atlas-indigo-700, #4338CA);
    --bdvs-accent:  var(--atlas-amber-500, #F59E0B);
    --bdvs-bottom-bar-height: 64px;
}

/* Bottom nav pinned, safe-area aware */
.bdvs-bottom-nav {
    position: fixed;
    inset-block-end: 0;
    inset-inline: 0;
    padding-block-end: env(safe-area-inset-bottom);
    height: calc(var(--bdvs-bottom-bar-height) + env(safe-area-inset-bottom));
}

/* Content avoids bottom bar */
.bdvs-content {
    padding-block-end: calc(var(--bdvs-bottom-bar-height) + env(safe-area-inset-bottom) + 1rem);
}
@media (min-width: 768px) {
    .bdvs-bottom-nav { display: none; }
    .bdvs-content { padding-block-end: 1rem; }
    .bdvs-desktop-nav { display: flex; }
}
```

### The 5 tabs
| Tab | Icon | Route |
|-----|------|-------|
| Home | house | `seller.dashboard` |
| Orders | shopping-bag | `seller.orders.index` |
| Products | grid | `seller.products.index` |
| Open Souk | storefront | `seller.community.index` |
| Messages | chat-bubble | `seller.messages.index` |

### JS scope fix — seller-dashboard.js moved to shell (2026-06-01)
`seller-dashboard.js` (the Simple/Advanced toggle) was originally included only in `seller/dashboard.blade.php`'s `@section('scripts')`. This meant the toggle was absent on Products, Orders, Messages, and every other seller page. The fix moved the `<script>` tag to the shell's `</body>` close so it loads on every seller page. See [[concepts/seller-js-layout-scope]] for the general pattern.

### Topbar avatar and sidebar profile link fix (2026-06-01)
The topbar avatar and sidebar "Store Profile" link previously pointed to `route('store.profile')` — the admin route gated by `permission:manage_sellers`. Sellers only have `manage_profile`, so clicking either link returned HTTP 403. Both were repointed to `route('seller.storeProfiles.edit')` (the seller-scoped route, `manage_profile` permission).

### Why a separate layout (not a modified admin layout)
The admin sidebar carries 17 items across 8 sections of business-operation data (commissions, stock, FINANCE, SETTINGS etc.). Sellers need only their own orders, their own products, the community marketplace, and messages. Showing the admin sidebar to sellers is a UX and security concern — even read-only, it exposes admin-surface navigation. The seller shell is a separate entrypoint that happens to share Atlas tokens with the admin surface but shares no templates or JS.

## Related Concepts
- [[concepts/beldify-admin-v3-sidebar]] — The admin sidebar the seller shell replaces for seller context
- [[concepts/open-souk-feature]] — The community marketplace tab in the seller shell
- [[concepts/atlas-design-system]] — Token source for Atlas indigo/amber palette reused here
- [[concepts/css-rtl-override-physical-properties]] — RTL pattern followed throughout the seller shell

## Sources
- [[daily/2026-05-24.md]] — Dedicated seller shell layout designed and implemented; 5-tab bottom nav + desktop pill nav; ~7 KB CSS; iOS safe-area handling; RTL-aware; no PixInvent; seller community UX (Freelancer-style browse/bid/track) built on top of this shell
- [[daily/2026-06-01.md]] — Session 25023e79: seller-dashboard.js moved from dashboard template to shell (toggle scope fix); topbar avatar + sidebar profile link repointed from admin store.profile to seller.storeProfiles.edit (403 fix)
