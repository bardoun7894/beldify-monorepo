# Beldify Dual-Mode Dashboard — Design Specification

> **Scope.** A redesign of UI density, hierarchy, navigation, and progressive disclosure for the Beldify seller dashboard (Next.js 15) and Super Admin dashboard (Laravel 10 / Blade V3). **No new business entities, endpoints, roles, or product flows.** Built entirely on the existing **Atlas** design system, the proven **5-tab seller shell** (`seller_shell.blade.php`), and the **V3 component library** (`kpi-tile`, `section-card`, `data-table`, `badge`, `btn`, `toggle`, `avatar`, `empty-row`, `page-header`).

> **Naming bridge (read once, applies everywhere).** *Light* and *Heavy* are the **structural mode names** used throughout this document and in IA. In the **rendered UI**, the toggle is labeled **Simple / Advanced** (AR: البسيط / المتقدم), matching the existing `beldify_seller_dash_mode` flag. **Light = Simple. Heavy = Advanced.** There is no "Pro."

---

## 1. UX Rationale

Beldify serves two very different operators. A **beginner seller** opening the dashboard for the first time needs to add a product, see who's buying, fulfill orders, and answer messages — nothing more. A **Super Admin** needs maximum operational visibility across the whole marketplace. Forcing both into one density model fails one of them.

The **Binance Lite-vs-Pro** pattern, adapted for e-commerce, solves this with **one app, two density layers** over identical data, tokens, and navigation:

| Principle | Why it applies here |
|---|---|
| **Dual-mode** | Sellers grow from zero to high-volume. A single dashboard that scales its *density* (not its data) lets the product follow the seller instead of overwhelming them on day one or boring them at scale. |
| **Progressive disclosure** | Cognitive load is the enemy for beginners. Light shows **essentials first** (products, carts, orders, messages). Analytics, filters, returns, segments, and exports are revealed **only** on switching to Heavy or opening an explicit "Advanced" section — never on first paint. |
| **Role-aware defaults** | Seller = **Light by default**, opt-in to Heavy. Super Admin = **Heavy by default** (platform ops require density), never auto-downgraded. |
| **Frozen skeleton** | The 5-tab nav is mobile-tested and proven. Mode changes **density inside screens**, never the navigation. This keeps mobile↔desktop and Light↔Heavy consistent and keeps beginners oriented. |

**Net effect:** the same seller never has to relearn the app — Heavy is a *superset* of Light, not a different product.

---

## 2. Information Architecture

The navigation skeleton is **identical across all modes and roles**: a 5-tab bottom bar (mobile <768px) / horizontal pill nav (desktop ≥768px) plus a persistent top bar. Only **in-screen density** and **disclosed surfaces** change.

**Disclosure tiers**
- **Always-visible** — the constant skeleton (5 tabs + top bar + per-screen primary CTA).
- **Contextual** — situational destinations reached from a screen or overflow (store profile, notifications, cart detail, order/product detail, command palette).
- **Advanced-only** — revealed solely in Heavy mode or behind an explicit "Advanced" affordance.

### 2.1 Seller Light (default for sellers)

Priority order drives **content hierarchy** (not nav order, which is frozen): **1) Products → 2) Carts/checkout → 3) Orders → 4) Messages.** Carts has no tab (the 5 are locked) and so lives as a **read-only awareness card on Home** + a contextual detail screen.

| Tab / Surface | Tier | Light contents |
|---|---|---|
| **Home** | always | Today snapshot (≤3 plain KPI tiles) · My products · Carts & checkout activity (read-only) · Orders to handle · Unread messages |
| **Orders** | always | Needs-action / All toggle · order cards · inline Confirm/Ship CTA |
| **Products** | always | Active / Out-of-stock counts · status chips · product card grid · Add product |
| **Open Souk** | always | Open requests / My responses · Respond CTA |
| **Messages** | always | Conversation list (unread-first) · thread · composer |
| Store profile | contextual | Shop info & branding · verification status |
| Notifications | contextual | New order · message · low stock · review |
| Cart detail | contextual | Live carts · abandoned carts (read-only) |
| Mode toggle | contextual | Switch to Advanced (top bar) |
| *All Heavy tooling* | advanced-only | Hidden in Light (see §2.2) |

### 2.2 Seller Heavy (opt-in superset)

Heavy keeps the 5 tabs and adds depth **in-place** via segmented sub-tabs and an "Advanced filters" disclosure, plus **one** genuinely new surface — **Insights**.

| Tab / Surface | Tier | Heavy additions over Light |
|---|---|---|
| **Home (Operations)** | always | 4–6 KPI tiles w/ deltas + sparklines · grouped Action Queue · live cart strip · single 30-day trend chart (collapsed on mobile) · Top products |
| **Orders** | always | Status sub-tabs · **Returns & Refunds** sub-tab · advanced filter drawer · bulk actions + Export CSV |
| **Products** | always | **Inventory Insights** sub-tab (velocity, dead stock, restock) · advanced filters · bulk edit + export |
| **Insights** | advanced-only | Sales · Conversion funnel · Trends · Customer segments · Inventory health · Returns analytics · Reporting/export *(desktop pill; mobile via Home header link + More overflow — never a 6th tab)* |
| **Open Souk** | always | Response performance (win rate, response time) |
| **Messages** | always | Search, filters, saved replies, response-time metric |
| Store & Account | contextual | Branding · verification · commission/earnings summary · notification prefs · mobile "More" host for Insights |

### 2.3 Super Admin Heavy (default for admin; locked)

Admin renders Heavy from first login behind the proven **8-section V3 sidebar** (Overview/Commerce/Catalog/Services/Marketplace/Finance/Community/Settings) + **Cmd+K** palette. The **9 required operational areas** are surfaced as enriched landing dashboards *inside* the sidebar, never a competing 9-item nav. Two areas (**Disputes/Refunds**, **Alerts & Exceptions**) are **synthesized lenses over existing data** — no new entity or endpoint.

| # | Required Area | Sidebar home | Tier | Source mapping |
|---|---|---|---|---|
| 1 | Platform overview | Overview → Command Center | always | `admin.dashboard` + `marketplace.dashboard` |
| 2 | Sellers performance | Marketplace → Sellers Performance | always | `marketplace.dashboard` + `storeProfiles` |
| 3 | Order operations | Commerce → Order Operations | always | `orders.index/analytics` + cart |
| 4 | **Disputes & refunds** | Commerce → Disputes & Refunds | always | **lens** over Orders (status=cancelled) + order-detail refund flow + commission reversal |
| 5 | Revenue overview | Finance → Revenue Overview | advanced-only | `commissions.index` + `generalLedger` |
| 6 | Inventory/catalog health | Catalog → Inventory & Stock Health | always | `stocks` + `categories` + `mega-offers` |
| 7 | Support activity | Community → Support Activity | always | `community.index` + `messages.index` |
| 8 | User/seller management | Marketplace → Store Requests / Profiles / Customers | always | `store-requests` + `storeProfiles` + `customers` |
| 9 | **Alerts & exceptions** | Overview → Alerts Center | always | **repurposes** `SidebarV3Composer` badges (pending_orders, abandoned_carts, store_requests, unread_messages) + low-stock |

---

## 3. Screen-by-Screen Structure (Desktop + Mobile)

> All cards: `rounded-2xl`, `ring-1 ring-amber-200/60`, `bg-white`, `shadow-sm`. RTL via logical properties. Min 44px touch targets on mobile.

### 3.1 Seller Light

**Home (Light Dashboard)** — *single glanceable command center, sections in priority order*
- **Desktop:** pill-nav shell (Home active). Centered single-column rail `max-w-3xl` (NOT a dense grid): greeting + verified badge → Today snapshot (3 plain KPI tiles inline, no charts) → My products → Carts & checkout (read-only) → Orders to handle (3 newest) → Unread messages (3 latest). Each card = label + one count + ≤3 rows + ghost "View all". "Switch to Advanced" text toggle top-inline-end.
- **Mobile:** brand top bar + fixed bottom 5-tab nav (safe-area aware). One vertical scroll, full-width cards in the same priority order; KPI tiles as a horizontal scroll strip. **FAB "Add product"** bottom-inline-end above nav.
- **CTAs:** Add product · View orders to handle · Reply to messages.

**Products (Light)** — *#1 priority; fastest add-product path*
- **Desktop:** header "My products" + prominent **Add product** (indigo-700) top-inline-end · 2 KPI tiles (Active, Out of stock) · segmented chips (All/Active/Out/Draft) · 2-up card grid (thumb, name, price, stock badge, Edit). No bulk ops, no analytics columns.
- **Mobile:** sticky header · Add-product FAB · 2-up KPI row · scroll chips · single-column cards → tap to detail. Empty state: friendly illustration + "Add your first product".
- **CTAs:** Add product · Edit product.

**Orders (Light)** — *action-first, minimal taxonomy*
- **Desktop:** "Needs action" / "All" segmented (default = Needs action) · 2 KPI tiles (Pending, Processing) · order cards (order #, buyer, item count, total, status badge, one contextual CTA: Confirm/Ship). **No payment-status column**, no export.
- **Mobile:** pending badge on tab · sticky status control · full-width cards · pull-to-refresh · empty state "You're all caught up."
- **CTAs:** Confirm order · Mark as shipped · Open order detail.

**Open Souk (Light)** — header · Open requests / My responses tabs · readable request cards (title, category, budget hint, time) · **Respond** CTA. Mobile: sticky tabs, single-column cards.

**Messages (Light)** — preserves real-time/FCM chat.
- **Desktop:** two-pane (conversation list inline-start + active thread inline-end, composer pinned bottom), unread-first.
- **Mobile:** list → full-screen thread (keyboard-safe, safe-area) → back chevron. Unread dot + bold preview.
- **CTAs:** Send reply · Open conversation.

**Carts & checkout activity (contextual)** — reached from Home's card (no tab). 2 KPI tiles (Live now, Abandoned today) · read-only list (product, qty, value, last activity) · soft hint "Recover abandoned carts — available in Advanced mode". **No campaign/coupon controls in Light.**

### 3.2 Seller Heavy

**Home — Operations Dashboard**
- **Desktop:** top bar (brand · pill nav incl. **Insights** · Simple/Advanced segmented toggle · bell · locale · user chip). Region 1: 4-col KPI row (Revenue, Orders, Conversion %, AOV) each w/ delta + sparkline. Region 2: ⅔ Action Queue (accordion: Orders to fulfill, Low stock, Unanswered messages, Pending returns — each a one-click CTA) + ⅓ Live cart feed. Region 3: **single** 30-day dual-axis trend chart w/ period selector. Region 4: Top products (5 rows) + Open Souk activity. **Max one large chart above the fold.**
- **Mobile:** sticky top bar w/ toggle pill · horizontal-scroll KPI chips · Action Queue as tappable rows w/ badges · **collapsed** "Trends" card (chart hidden by default to protect 4G budget) · live cart (3 recent). Insights via header link + More overflow. 5-tab nav unchanged.
- **CTAs:** Fulfill next order · Restock low item · Reply · View full analytics · Switch to Simple.

**Orders — List + Returns/Refunds**
- **Desktop:** header + Export CSV + search · status sub-tabs (All/New/Processing/Shipped/Completed/Cancelled/**Returns & Refunds**, amber-dotted) · "Advanced filters" right-drawer (collapsed: date, value, payment, fulfillment, customer, SKU) · data-table w/ checkbox bulk bar (mark shipped, print labels, export) · row action menu. Returns sub-tab swaps to RMA requests (reason, status, approve/deny).
- **Mobile:** search + filter icons (full-screen sheet) · status scroll-chips w/ counts · order **cards** · "Select" reveals checkboxes + bottom action sheet · export in overflow.
- **CTAs:** Mark shipped · Process return/refund · Apply filters · Export CSV.

**Products — Listing + Inventory Insights**
- **Desktop:** header + Add product + search · sub-tabs Listing / **Inventory Insights** · grid/table toggle · advanced filter drawer (status, stock level, category, performance) · bulk-edit bar + export · rows show thumb, name, SKU, price, stock badge, velocity mini-bar. Insights: Low/Out cards, Dead-stock list, Fast movers, Restock suggestions (≤1 bar chart).
- **Mobile:** Add + search + filter icons · sub-tab chips · cards w/ quick stock-stepper + overflow · Insights as stacked summary cards (charts collapsed behind "View chart").
- **CTAs:** Add product · Edit stock · Bulk edit · View restock suggestions · Export.

**Insights — Analytics Center (Heavy-only)**
- **Desktop:** header + global period selector (7d/30d/90d/custom) + Export report · section sub-nav (Sales/Conversion/Trends/Customers/Inventory/Returns/Reports) · **one primary chart + one supporting table per panel, never more than two visualizations**. Generous inter-section whitespace.
- **Mobile:** reached from Home link + More (not a tab) · period chip · scroll sub-nav · one panel at a time, single chart sized to viewport · charts lazy-loaded.
- **CTAs:** Change period · Export report · Drill into segment · Schedule report.

### 3.3 Super Admin Heavy

> All screens extend `admin.dashboard` with the **non-negotiable Indigo→Amber radial page-header banner**, light-mode-locked, V3 components only. Mobile: sidebar → off-canvas drawer; KPI grids → 2-col; data-tables → `table-card` lists.

| Screen | Desktop structure | Mobile | Primary CTAs |
|---|---|---|---|
| **Platform Command Center** | sidebar + banner · 6-tile KPI grid (GMV, orders today, active stores, new users, pending approvals, open exceptions) · ⅔ revenue trend + ⅓ Alerts mini-feed · row: Top sellers / Order funnel / Catalog health | banner compresses · KPI 2-col swipe · trend → sparkline · alerts as card list | Open Alerts · View Marketplace Perf · Export · Switch to Focus |
| **Marketplace / Sellers Performance** | KPI (active sellers, avg GMV, avg rating, verified %, suspended) · advanced filter toolbar · dense sellers data-table (store, GMV, orders, fulfillment, rating, commission, status) · right-rail seller drill-down | KPI 2-col · Filters sheet · table → card list · drill-down full-screen | View seller · Adjust commission · Suspend/activate · Export CSV |
| **Order Operations** | banner · status tab strip w/ badge counts · KPI (orders today, awaiting fulfillment, late shipments, completed) · advanced filters · dense orders table (order #, customer, store, total, payment badge, fulfillment badge, age) · Order Analytics (advanced-only sibling tab) | status scroll-chips · KPI 2-col · table → card rows · filters sheet · **payment fields read-only & hidden from summary** | Advance status · Open detail · Filter · Export |
| **Disputes & Refunds** *(synthesized lens)* | KPI (open disputes, refunds pending, refunded amount, dispute rate %) · two-pane: cancelled-orders table + detail drawer w/ **existing** refund/cancel + commission adjustment controls · filters (store/reason/date) | KPI 2-col · table → card list · detail full-screen · filters sheet | Process refund · Cancel/reverse · Adjust commission · Resolve |
| **Revenue Overview** *(advanced-only)* | KPI (gross revenue, commission earned, payouts owed, net) · revenue trend chart · commission table (seller, GMV, rate, commission, batch status) · Ledger + batches as deep links | KPI 2-col · compact chart · table → card list · ledger via link card | Run commission batch · Open Ledger · Export · Adjust rate |
| **Inventory & Catalog Health** | KPI (total SKUs, out-of-stock, low-stock, pending products, active offers) · stock-health breakdown · products table (product, store, stock badge, price, category) + filters · Categories + Mega Offers sibling tabs | KPI 2-col · health stacked cards · table → card list · filters sheet | Filter low/out · Open product · Manage categories · Create offer |
| **Support Activity** | KPI (open RFQs, unanswered threads, unread messages, avg response) · split: Open Souk RFQ table + DM threads w/ unread badges · right-rail thread preview | KPI 2-col · Souk/Messages tabs · threads → card list · full-screen conversation | Reply · Open RFQ · Mark resolved · Filter unanswered |
| **User & Seller Management** | tab strip (Store Requests / Profiles / Customers) w/ badge counts · KPI (pending approvals, verified, suspended, total customers) · dense table per tab + row actions · approval detail panel | tabs scroll-chips · KPI 2-col · card rows · approval full-screen · bulk via selection sheet | Approve/reject · Verify · Set commission · Suspend/activate |
| **Alerts & Exceptions Center** *(synthesized)* | severity-grouped cards (Critical/Warning/Info): pending order backlog, abandoned-cart spike, store-requests waiting, unread support, low/out-of-stock — each count (from badge) + jump-to CTA · right-rail recent-exceptions timeline | cards stack single-column, severity color-coded · tappable deep-links · pull-to-refresh · sticky counts | Jump to flagged orders · Review store requests · Open abandoned carts · Resolve low-stock |

---

## 4. Navigation Model

| Element | Behavior |
|---|---|
| **5-tab bottom nav (mobile) / pill nav (desktop)** | Identical 5 anchors in **both modes, sellers AND admin**: **Home · Orders · Products · Open Souk · Messages** (real `$tabs`: home, orders, products, souk, **inbox/Messages**). Never grows to a 6th tab; never shifts on mode change. |
| **Persistent top bar** | brand mark · notifications bell · language switcher (AR/EN RTL flip) · **mode toggle** · user/profile chip. Present on mobile and desktop. |
| **Carts (Light priority #2)** | Not a tab — surfaced as the read-only **Carts & checkout activity card on Home**; conversion-funnel detail disclosed only in Heavy. |
| **Hidden in Advanced (Heavy-only, in-page)** | Seller: advanced filter drawers, sales analytics/trends, conversion funnel, inventory insights, returns/refunds, customer segments, export/reporting — all as **in-page Advanced sections, filter drawers, or a mobile "More" sheet**, never new tabs. |
| **Admin sidebar** | 8-section V3 sidebar + Cmd+K palette — always-on for Super Admin (Heavy by default), off-canvas drawer on mobile. |
| **Mode switch location** | One canonical spot, **identical on desktop and mobile**: a compact **Simple/Advanced segmented control pinned inline-end of the top bar, just before the user chip**. Mirrored in the profile/avatar menu and Settings → Dashboard view. **Never** in the bottom tab bar. RTL: mirrors to inline-start via logical properties. Super Admin does not see this toggle (locked Heavy; optional "Focus view" only). |
| **First-time seller** | Always lands in **Light/Simple**, toggle resting on Simple. One dismissible first-login hint points at the toggle, then never nags. **No auto-promotion** to Heavy, ever. After a light activity threshold (≥10 products AND ≥5 completed orders), an optional dismissible nudge may resurface once (max once / 14 days, 3 lifetime). Choice persists in `UserPreference`. |

---

## 5. Mode-Switch UX Rules

| Rule | Detail |
|---|---|
| **Defaults** | New seller (age <30d OR product_count=0) → **Simple**, hard default, no upsell first 3 sessions. Returning seller → respect persisted `UserPreference.dashboard_mode` verbatim, per user (not per device). Admin → **Advanced** default, never auto-downgraded. Missing preference → derive from role, never from cookie alone. |
| **UI-only** | Switching changes density/hierarchy/disclosure **only**. It never hides an order, message, product, or payout. Advanced features are **collapsed, not deleted or paywalled**. |
| **Reversible** | The same control is always present. **Advanced → Simple = single tap, no confirmation** (low-risk), instant, with a dismissible toast. Simple → Advanced shows the one-time explainer on first switch only, then instant thereafter. No cooldown, no switch limit, no draft loss either direction. |
| **Explain-before-switch** | One-time confirm sheet **only** on first Simple→Advanced. Title + honest body (states exactly what is added and that **nothing is removed or hidden**) + two equal-weight buttons + "Don't show again" **OFF by default**. (Copy in §8.) |
| **Mid-task safety** | Toggle is **disabled (with tooltip)** during unsaved create/edit forms, fulfillment steps, or open chats — never trigger a surprise context loss. |
| **No dark pattern** | Two **equally-styled** pills in one segmented control — neither dimmed, starred, or amber-glowed toward Advanced. No nagging modals. No FOMO/fear/competitive-shame copy. No trap on switch-back. No data loss or gating. No forced/auto/A-B upgrade. Honest preview only. |
| **Accessibility** | Real ARIA segmented control / radiogroup, visible focus, keyboard-operable, SR-labeled in EN+AR; reversibility stated where the switch happens. |
| **Locale** | Toggle + all copy localize and flip in AR/MA via logical properties. Mode preference is **independent of language** (switching one never changes the other). |

**Toggle label set**

| | EN label | EN sublabel | EN tooltip | AR label | AR sublabel |
|---|---|---|---|---|---|
| **Simple** (=Light) | Simple | Just the essentials | Your products, carts, orders and messages — clean and quick. | البسيط | الأساسيات فقط |
| **Advanced** (=Heavy) | Advanced | Analytics, filters & reports | Adds sales analytics, advanced filters, inventory insights and exports. Nothing is removed. | المتقدم | تحليلات وفلاتر وتقارير |

**Group label:** EN *Dashboard mode* / AR *وضع لوحة التحكم* · **Settings row:** EN *Dashboard view* / AR *عرض لوحة التحكم*.
**Placement:** segmented control (two equal pills, not on/off) in topbar between language switcher and user chip; mirrored as a Settings row. Mobile <768px: Settings + topbar overflow, never the bottom nav.
**Suggested i18n keys:** `messages.seller_mode.{group_label,simple,simple_long,simple_sub,advanced,advanced_long,advanced_sub,settings_row}`.

---

## 6. Visual Design Direction

**Direction:** clean editorial e-commerce SaaS grounded in Atlas — a warm Moroccan marketplace back-office (Shopify/Stripe-grade with editorial warmth). **Atlas Indigo `#4338ca` (indigo-700)** = the single primary-action color; **Saffron Amber `#f59e0b` (amber-500)** = accent/highlight/eyebrow only (warm amber-100/200 hairlines, not cold gray). **Playfair Display** for headlines only; **Poppins** (Latin) + **Rubik** (Arabic) for body. `rounded-2xl` cards, `rounded-full` pills. Dual-mode is a **density/disclosure layer over identical tokens** — Light and Heavy share palette, type, radii, and components; only density and disclosed controls change. Reuses the 5-tab/pill nav and V3 components **verbatim** (re-arrange and gate, do not reskin).

**Density rules**

| Dimension | Light (Simple) | Heavy (Advanced) |
|---|---|---|
| Surfaces | single column, 3–5 stacked cards, ≤3–4 KPI tiles | multi-band grid (2–3 cols), up to 6 KPI tiles + panels |
| Spacing | `tw-p-6`, gap-4→6, full py-16/20 rhythm | `tw-p-4`, gap-3 (but **never** remove inter-band whitespace) |
| Lists | tap-friendly cards/rows, ≥44px targets, no dense tables | V3 `data-table`: sortable, multi-select, bulk, column filters |
| Charts | **zero** (numbers + status pills only; no charting bundle shipped) | sparklines + trend lines, **lazy-loaded**, indigo line + amber point |
| KPI tiles | count + label only | + delta, sparkline, period selector, comparison meta |
| Filters | ≤1 inline (e.g. status segmented) | full advanced-filter drawer, disclosed not default-open |
| Financial fields | payment_status/method **absent** from summaries | shown in admin/Heavy tables, read-only (audit trail) |

**RTL readiness:** logical properties everywhere (`inset-inline`, `margin-inline`, `padding-block/inline`, start/end — never left/right). Direction is data-driven (`useDirection()` hook / Blade `dir` from locale). Rubik at parity size (never shrunk/italicized); Playfair is Latin-only — Arabic headlines use Rubik 600. Chevrons/arrows/steppers/"view all →" mirror. The bilingual brand lockup (بلدي rtl + ify ltr) is the only fixed-direction element. All strings through i18n (`t()` / `__('messages.*')`). Verify Heavy tables and Light cards + safe-area on an RTL iPhone.

**Anti-patterns (forbidden)**
- Crypto/terminal aesthetic: neon-on-dark, glassmorphism, glow, candlestick/ticker chrome, up-green/down-red flashing, dark-mode-by-default.
- Generic SaaS purple→blue / blue→cyan gradient buttons. Primary is solid indigo-700 → indigo-800 hover, full stop.
- **Any chart/sparkline/analytics widget in Seller Light** — even small ones; no charting library in the Light bundle.
- Dense tables, multi-column filter bars, or 6-tile KPI walls shown to a beginner by default (Heavy-only; **hidden**, not greyed).
- Amber as a primary CTA, or two competing primaries in one view.
- Cold gray hairlines / gray-on-gray panels; rainbow KPI tiles ignoring the semantic tint map.
- Hardcoded left/right CSS, LTR-assumed order, shrunken/italic/serif Arabic.
- Bounce/elastic/spring easing, autoplay >5s, pulsing badges, motion ignoring `prefers-reduced-motion` (motion = 200ms ease-out-cubic, purposeful only).
- Inventing new tokens/radii/components, Bootstrap/PixInvent classes, or a parallel nav model.
- Exposing payment_status/method or destructive refund actions in any Light summary.

---

## 7. Component Recommendations

All extend existing V3 / Atlas components; props are **gated by mode**.

| Component | Base | Anatomy | Light | Heavy / Admin |
|---|---|---|---|---|
| **KPI Card / Stat Tile** | `x-v3.kpi-tile` | tinted icon chip (w-11 h-11) + uppercase label + bold value + optional meta. Tints: amber=brand/pending, emerald=success/active, rose=abandoned/cancelled, indigo=processing/info, slate=neutral. States: default, loading skeleton, zero (muted, no alarm), actionable (whole tile links). | ≤2–3 tiles, plain value, **no** trend/sparkline; big tap target linking to its list | 4+ grid, `trend` delta, inline `sparkline`, period chip, "+12% vs last week" |
| **Order Row / Card** | responsive: card (mobile) ↔ `x-v3.data-table` row | order # + avatar/name + 1–3 thumbs + total + status badge + date + CTA. States: default, new (amber left-border + dot), needs-action, fulfilled (muted), cancelled (rose, struck total), selected. **payment_status never in Light.** | full-width stacked card, one badge, one big CTA (Confirm/Ship), no payment fields | compact table rows, hover `bg-amber-50/40`, bulk checkboxes, inline status dropdown, filter toolbar, export |
| **Product Card / Table** | card grid (Light) ↔ `data-table` (Heavy) | square image (`rounded-2xl ring-1 ring-amber-200`, gradient placeholder), name, price, stock badge (In=emerald/Low=amber/Out=rose), featured chips, quick menu. States: default, out-of-stock (dimmed + rose), draft (slate, reduced opacity), low-stock, hover lift, loading, empty→onboarding | 2-col card grid, big imagery, one-tap Edit, pinned Add-product CTA; reads like storefront | dense table: SKU, variants, stock count, velocity, last-sold, bulk edit + visibility, sort, filters, CSV export |
| **Message Inbox Preview** | `x-v3.avatar` + `UnreadBadge` | avatar + name + truncated snippet + relative time + unread amber pill + typing dot. Real-time WebSocket/FCM preserved (presentational only). States: read (muted), unread (bold + dot + count), new-message flash, responded (emerald check), loading, empty | 1-line rows; Home shows top 3 unread + "View all"; no filters | search, filter (unread/order-linked/archived), tags, bulk mark-read, response-time chip; admin cross-seller queue |
| **Status Badge** | `x-v3.badge` | `rounded-full` pill, optional `la-*` icon, semantic tint, sm/md. Canonical map: amber=pending/brand, emerald=active/completed, rose=abandoned/cancelled/error, indigo=processing/info, slate=neutral. Static label; parent is the target. | prefer **one** badge/item, plain human label, sm | multiple badges/row (status + payment + flags), admin tints (dispute/refund=rose, verification-pending=amber) |
| **Alert / Exception Block** | `x-v3.section-card` + badge | leading tint bar (logical inset-inline-start) + icon + title + short message + inline CTA. Severity: info=indigo, warning=amber, critical=rose. States: default, dismissible (persists), actionable, stacked, empty→hidden. Distinct from transient Sonner toast. | only genuinely critical, single-action ("1 order needs confirmation"); suppressed if nothing urgent | full exceptions feed: severity grouping, counts, filters, dismiss/snooze; admin platform-wide w/ assignment + drill-down |
| **Empty State** | `x-v3.empty-row` (tables) + new `x-v3.empty-card` (grids) | centered icon + title + supportive subtitle + primary CTA. Variants: first-time/onboarding, filtered-empty ("clear filters"), error-empty (rose, retry), loading-vs-empty distinction | warm beginner copy + ONE obvious CTA; doubles as onboarding | terse/neutral; filtered-empty offers "clear filters" |
| **Onboarding Hint / Setup Checklist** | `section-card` + badge + btn | progress checklist (Add product → Complete profile → First order), each step a checkbox/badge + label + CTA, indigo progress bar, "hide tips". Plus inline coachmark (amber-50 bubble, one-time, persists in `UserPreference`). | **Light-only by design**; shows for new sellers, auto-fades as steps complete | **entirely hidden** (absence is part of what makes Advanced feel "pro"); never shown to Super Admin |
| **Mode Toggle** | `x-v3.toggle` / segmented | two equal pills (Simple \| Advanced), active state, persists to `UserPreference`, tooltip per mode, RTL logical props. States: simple-active, advanced-active, switching, disabled/locked | interactive, defaults Simple, choice persists | **non-interactive label** for Super Admin (always Advanced, shown as badge not control) |
| **Cart / Checkout Activity Card** | `section-card` + kpi pattern | live cart list (avatar, item count, value, age badge: active=indigo/abandoned=rose/recovered=emerald) + recovery CTA. Backend Cart/CartRecovery preserved (presentational). | "X active carts / Y in checkout now" summary + short list, **no recovery tools**, reassuring not alarming | abandoned-cart table, recovery coupon/token actions, conversion funnel, time-to-abandon; admin platform-wide + campaign controls |

---

## 8. Microcopy (EN + AR, copy-paste ready)

### Mode switch

| Context | EN | AR |
|---|---|---|
| Simple pill | Simple | البسيط |
| Advanced pill | Advanced | المتقدم |
| Group label | Dashboard mode | وضع لوحة التحكم |
| Simple tooltip | Your products, carts, orders and messages — clean and quick. | منتجاتك وسلالك وطلباتك ورسائلك — بشكل واضح وسريع. |
| Advanced tooltip | Adds analytics, advanced filters, inventory insights and exports. Nothing is removed. | يضيف التحليلات والفلاتر المتقدمة ورؤى المخزون والتصدير. لا يتم حذف أي شيء. |
| Pre-switch title | Switch to Advanced mode? | التبديل إلى الوضع المتقدم؟ |
| Pre-switch body | Advanced keeps everything you have and adds sales analytics, filters, inventory insights, returns & refunds, and reports. Nothing is removed or hidden — switch back to Simple anytime. | الوضع المتقدم يحتفظ بكل ما لديك ويضيف تحليلات المبيعات والفلاتر ورؤى المخزون والمرتجعات والاستردادات والتقارير. لا يتم حذف أو إخفاء أي شيء — ويمكنك العودة إلى البسيط في أي وقت. |
| Pre-switch primary btn | Switch to Advanced | التبديل إلى المتقدم |
| Pre-switch ghost btn | Stay in Simple | البقاء في البسيط |
| Don't-show-again | Don't ask me again | لا تسألني مرة أخرى |
| Toast: now Advanced | You're in Advanced mode. More tools are now in view. | أنت الآن في الوضع المتقدم. أصبحت أدوات إضافية ظاهرة. |
| Toast: now Simple | You're back in Simple mode. Switch to Advanced anytime from the top bar. | لقد عدت إلى الوضع البسيط. يمكنك التبديل إلى المتقدم في أي وقت من الشريط العلوي. |
| Settings row label | Dashboard view | عرض لوحة التحكم |
| Settings row help | Start simple. Turn on Advanced when you want analytics, filters and reports. | ابدأ بالبسيط. فعّل المتقدم عندما تريد التحليلات والفلاتر والتقارير. |
| Growth hint card | Your shop is growing. Want sales analytics, filters and reports? Try Advanced mode — you can switch back anytime. | متجرك ينمو. هل تريد تحليلات المبيعات والفلاتر والتقارير؟ جرّب الوضع المتقدم — ويمكنك العودة في أي وقت. |
| Growth hint dismiss | No thanks | لا، شكراً |

### Onboarding (Seller Light, beginner)

| Anchor | EN | AR |
|---|---|---|
| Products | Start here: add your first product. Tap + to upload photos and set a price. | ابدأ من هنا: أضف منتجك الأول. اضغط + لرفع الصور وتحديد السعر. |
| Carts | When shoppers add items, you'll see their carts here — a chance to follow up. | عندما يضيف المتسوقون منتجات، ستظهر سلالهم هنا — فرصة للمتابعة. |
| Orders | New orders land here. Tap one to confirm and ship. | الطلبات الجديدة تصل هنا. اضغط على طلب لتأكيده وشحنه. |
| Messages | Buyers can message you here. Quick replies build trust. | يمكن للمشترين مراسلتك هنا. الردود السريعة تبني الثقة. |
| Mode reassurance | We've kept things simple to start. Need more? Advanced mode is one tap away — and you can always come back. | أبقينا الأمور بسيطة في البداية. تحتاج المزيد؟ الوضع المتقدم على بُعد نقرة — ويمكنك العودة دائماً. |

---

## 9. Machine-Readable Screen Structure (JSON)

```json
{
  "namingBridge": {
    "Light": "Simple",
    "Heavy": "Advanced",
    "ar": {
      "Simple": "البسيط",
      "Advanced": "المتقدم"
    }
  },
  "navSkeleton": {
    "tabs": [
      "Home",
      "Orders",
      "Products",
      "Open Souk",
      "Messages"
    ],
    "tabKeys": [
      "home",
      "orders",
      "products",
      "souk",
      "inbox"
    ],
    "badges": {
      "orders": "pending_orders",
      "inbox": "unread_messages"
    },
    "topBar": [
      "brand",
      "notifications",
      "languageSwitcher",
      "modeToggle",
      "userChip"
    ],
    "modeToggleLocation": "top bar inline-end before user chip; mirrored in profile menu + Settings; never in bottom nav",
    "breakpoint": "bottom nav <768px / pill nav >=768px",
    "constant": "identical across all modes and roles"
  },
  "modes": {
    "sellerLight": {
      "role": "Seller",
      "uiLabel": "Simple",
      "default": true,
      "disclosureTiers": {
        "alwaysVisible": [
          "Home",
          "Orders",
          "Products",
          "Open Souk",
          "Messages"
        ],
        "contextual": [
          "Store profile",
          "Notifications",
          "Cart detail",
          "Mode toggle"
        ],
        "advancedOnly": [
          "Sales analytics",
          "Conversion metrics",
          "Advanced filters",
          "Inventory insights",
          "Returns & refunds",
          "Customer segments",
          "Cart recovery campaigns",
          "Export & reporting"
        ]
      },
      "contentPriority": [
        "Products",
        "Carts/checkout",
        "Orders",
        "Messages"
      ],
      "screens": [
        {
          "name": "Home (Light Dashboard)",
          "tab": "home",
          "purpose": "Glanceable command center; sections ordered by the 4 Light priorities; no charts",
          "sections": [
            "Greeting + verification badge",
            "Today snapshot (<=3 plain KPI tiles, no charts)",
            "My products status",
            "Carts & checkout activity (read-only)",
            "Orders to handle (3 newest)",
            "Unread messages (3 latest)",
            "Switch to Advanced toggle"
          ],
          "desktop": "Pill-nav shell; centered single-column rail max-w-3xl in priority order; ghost View-all links; toggle top-inline-end",
          "mobile": "Brand bar + bottom 5-tab nav (safe-area); vertical scroll cards; KPI horizontal strip; Add-product FAB",
          "primaryCTAs": [
            "Add product",
            "View orders to handle",
            "Reply to messages"
          ],
          "charts": false
        },
        {
          "name": "Products (Light)",
          "tab": "products",
          "purpose": "Fastest add-product path; #1 priority",
          "sections": [
            "Header + Add product CTA",
            "Stock KPI tiles (Active, Out of stock)",
            "Status filter chips",
            "Product card grid",
            "Empty/first-product state"
          ],
          "desktop": "Header + prominent Add product; 2 KPI tiles; segmented chips; 2-up card grid; no bulk ops",
          "mobile": "Sticky header; Add-product FAB; 2-up KPI; scroll chips; single-column cards; friendly empty state",
          "primaryCTAs": [
            "Add product",
            "Edit product"
          ],
          "charts": false
        },
        {
          "name": "Orders (Light)",
          "tab": "orders",
          "purpose": "Action-first fulfillment; minimal status taxonomy; no payment column",
          "sections": [
            "Header",
            "Needs action / All toggle",
            "Order KPI tiles (Pending, Processing)",
            "Order card list with inline action",
            "Empty/caught-up state"
          ],
          "desktop": "Needs-action default; 2 KPI tiles; order cards with one contextual CTA; no payment-status, no export",
          "mobile": "Pending badge; sticky status control; full-width cards; pull-to-refresh; empty state",
          "primaryCTAs": [
            "Confirm order",
            "Mark as shipped",
            "Open order detail"
          ],
          "charts": false
        },
        {
          "name": "Open Souk (Light)",
          "tab": "souk",
          "purpose": "Browse community RFQs and respond; kept lean",
          "sections": [
            "Header",
            "Open requests / My responses tabs",
            "Request feed cards",
            "Respond action"
          ],
          "desktop": "Two-tab switch; readable request cards; Respond CTA; no sorting/analytics",
          "mobile": "Sticky tabs; single-column cards; tap to detail with Respond CTA",
          "primaryCTAs": [
            "Respond to request",
            "View my responses"
          ],
          "charts": false
        },
        {
          "name": "Messages (Light)",
          "tab": "inbox",
          "purpose": "Fast buyer<->seller replies; real-time/FCM preserved; unread-first",
          "sections": [
            "Conversation list (unread-first)",
            "Active thread",
            "Message composer",
            "Empty/no-conversations state"
          ],
          "desktop": "Two-pane: list inline-start + thread inline-end, composer pinned bottom",
          "mobile": "List -> full-screen thread (keyboard-safe, safe-area) -> back chevron; unread dot + bold preview",
          "primaryCTAs": [
            "Send reply",
            "Open conversation"
          ],
          "charts": false
        },
        {
          "name": "Carts & checkout activity (contextual)",
          "tab": "home",
          "purpose": "Passive read-only awareness; recovery tooling reserved for Heavy",
          "sections": [
            "Cart KPI tiles (Live, Abandoned)",
            "Read-only cart/checkout list",
            "Heavy-mode recovery hint (passive)"
          ],
          "desktop": "Reached from Home card; 2 KPI tiles; read-only list; soft Advanced-mode hint; no campaign controls",
          "mobile": "2-up KPI; full-width read-only rows; dismissible upsell-to-Advanced card",
          "primaryCTAs": [
            "Back to Home",
            "Switch to Advanced mode"
          ],
          "charts": false
        }
      ]
    },
    "sellerHeavy": {
      "role": "Seller",
      "uiLabel": "Advanced",
      "default": false,
      "supersetOf": "sellerLight",
      "disclosureTiers": {
        "alwaysVisible": [
          "Home (Operations)",
          "Orders",
          "Products",
          "Open Souk",
          "Messages",
          "Mode toggle"
        ],
        "contextual": [
          "Store & Account",
          "Mobile More overflow"
        ],
        "advancedOnly": [
          "Insights"
        ]
      },
      "newSurface": "Insights (desktop pill; mobile via Home header link + More overflow, never a 6th tab)",
      "screens": [
        {
          "name": "Home - Operations Dashboard",
          "tab": "home",
          "purpose": "Operational command center: earnings, action queue, trends without leaving daily flow",
          "sections": [
            "Top bar + mode toggle",
            "KPI tiles row (Revenue, Orders, Conversion %, AOV)",
            "Action queue (grouped CTA rows)",
            "Live cart activity",
            "30-day trend chart (collapsed on mobile)",
            "Top products + Open Souk activity",
            "Deep-link to Insights"
          ],
          "desktop": "Pill nav incl Insights + Simple/Advanced toggle; 4-col KPI w/ delta+sparkline; 2/3 Action Queue + 1/3 live cart; single 30-day chart; max 1 large chart above fold",
          "mobile": "Sticky bar w/ toggle; horizontal-scroll KPI chips; Action Queue rows w/ badges; collapsed Trends card; Insights via header link + More",
          "primaryCTAs": [
            "Fulfill next order",
            "Restock low item",
            "Reply to message",
            "View full analytics",
            "Switch to Simple"
          ],
          "charts": true,
          "chartsLazyLoaded": true
        },
        {
          "name": "Orders - List + Returns/Refunds",
          "tab": "orders",
          "purpose": "Process and analyze orders at volume; status pipeline, filters, returns, bulk, export",
          "sections": [
            "Header + search + export",
            "Status segmented sub-tabs (incl Returns/Refunds)",
            "Advanced filters (drawer/sheet, collapsed)",
            "Bulk action bar (on selection)",
            "Orders table (desktop) / cards (mobile)",
            "Pagination"
          ],
          "desktop": "Status sub-tabs (All/New/Processing/Shipped/Completed/Cancelled/Returns); right filter drawer; data-table w/ bulk bar + row menu",
          "mobile": "Search + filter icons (full-screen sheet); status scroll-chips; order cards; Select reveals checkboxes + bottom sheet",
          "primaryCTAs": [
            "Mark as shipped",
            "Process return / refund",
            "Apply advanced filters",
            "Export CSV",
            "Open order detail"
          ],
          "charts": false
        },
        {
          "name": "Products - Listing + Inventory Insights",
          "tab": "products",
          "purpose": "Manage catalog at scale + inventory intelligence hidden in Light",
          "sections": [
            "Header + Add product + search",
            "Listing / Inventory Insights sub-tabs",
            "Advanced filters (drawer/sheet)",
            "Bulk edit + export bar",
            "Product list/grid with stock + velocity",
            "Inventory insight cards"
          ],
          "desktop": "Sub-tabs Listing/Insights; grid-table toggle; filter drawer; bulk-edit bar; rows w/ SKU+velocity; Insights <=1 bar chart",
          "mobile": "Add + search + filter icons; sub-tab chips; cards w/ stock stepper + overflow; Insights stacked cards, charts collapsed",
          "primaryCTAs": [
            "Add product",
            "Edit stock",
            "Bulk edit",
            "View restock suggestions",
            "Export catalog"
          ],
          "charts": true,
          "chartsLazyLoaded": true
        },
        {
          "name": "Insights - Analytics Center",
          "tab": "more",
          "advancedOnly": true,
          "purpose": "Dedicated analytics unlocked only in Heavy; one section per scroll block",
          "sections": [
            "Header + period selector + export",
            "Section sub-nav (Sales/Conversion/Trends/Customers/Inventory/Returns/Reports)",
            "Primary chart per section",
            "Supporting table/list per section",
            "Reporting & export center"
          ],
          "desktop": "Period selector + export; section sub-nav; max 2 visualizations per panel; ample whitespace",
          "mobile": "Reached from Home link + More (not a tab); period chip; scroll sub-nav; one panel/chart at a time; lazy-loaded",
          "primaryCTAs": [
            "Change period",
            "Export report",
            "Drill into segment",
            "Schedule report"
          ],
          "charts": true,
          "chartsLazyLoaded": true
        }
      ]
    },
    "adminHeavy": {
      "role": "Super Admin",
      "uiLabel": "Advanced (locked)",
      "default": true,
      "toggle": "hidden (optional Focus view only; Advanced never auto-downgrades)",
      "chrome": [
        "8-section V3 sidebar (Overview/Commerce/Catalog/Services/Marketplace/Finance/Community/Settings)",
        "Cmd+K command palette",
        "non-negotiable Indigo->Amber radial page-header banner",
        "light-mode-locked"
      ],
      "mobile": "sidebar -> off-canvas drawer; KPI -> 2-col; data-tables -> table-card lists; safe-area padding",
      "disclosureTiers": {
        "alwaysVisible": [
          "Overview",
          "Commerce",
          "Catalog",
          "Marketplace",
          "Community"
        ],
        "contextual": [
          "Services",
          "Command Palette",
          "per-seller/dispute drill-downs"
        ],
        "advancedOnly": [
          "Finance",
          "Settings",
          "Order Analytics",
          "Ledger & batches"
        ]
      },
      "screens": [
        {
          "name": "Platform Command Center",
          "area": "1 Platform overview",
          "sidebar": "Overview",
          "purpose": "Single-glance marketplace health",
          "sections": [
            "Page-header banner",
            "6-tile KPI grid (GMV, orders today, active stores, new users, pending approvals, open exceptions)",
            "Revenue trend + Alerts mini-feed",
            "Top sellers / Order funnel / Catalog health row",
            "Quick links to all 9 areas"
          ],
          "desktop": "Sidebar + banner; 6-col KPI; 2/3 trend + 1/3 alerts; section-card row",
          "mobile": "Banner compresses; KPI 2-col swipe; trend->sparkline; alerts card list",
          "primaryCTAs": [
            "Open Alerts Center",
            "View Marketplace Performance",
            "Export overview report",
            "Switch to Focus mode"
          ],
          "charts": true
        },
        {
          "name": "Marketplace & Sellers Performance",
          "area": "2 Sellers performance",
          "sidebar": "Marketplace",
          "purpose": "Seller leaderboard + performance lens",
          "sections": [
            "Page-header (Sellers Performance)",
            "Seller KPI summary",
            "Advanced filter toolbar",
            "Sellers data-table / card list",
            "Per-seller drill-down (contextual)"
          ],
          "desktop": "KPI row; filter toolbar; dense sellers table; right-rail drill-down",
          "mobile": "KPI 2-col; Filters sheet; table->card list; drill-down full-screen",
          "primaryCTAs": [
            "View seller profile",
            "Adjust commission rate",
            "Suspend / activate store",
            "Export seller performance CSV"
          ],
          "charts": false
        },
        {
          "name": "Order Operations",
          "area": "3 Order operations",
          "sidebar": "Commerce",
          "purpose": "Daily order processing across all statuses",
          "sections": [
            "Page-header (Order Operations)",
            "Status tab strip with badge counts",
            "Order KPI row",
            "Advanced filters",
            "Orders data-table / card list",
            "Order Analytics (advanced-only tab)"
          ],
          "desktop": "Status tabs w/ badges; KPI; advanced filters; dense orders table w/ dual status badges",
          "mobile": "Status scroll-chips; KPI 2-col; card rows; filters sheet; payment fields read-only & hidden from summary",
          "primaryCTAs": [
            "Advance order status",
            "Open order detail",
            "Filter by status/store",
            "Export orders"
          ],
          "charts": false
        },
        {
          "name": "Disputes & Refunds",
          "area": "4 Disputes/refunds",
          "sidebar": "Commerce",
          "synthesized": "lens over Orders status=cancelled + existing refund/cancel flow + commission reversal; no new entity/endpoint",
          "purpose": "Operational view of cancellations, refunds, commission adjustments",
          "sections": [
            "Page-header (Disputes & Refunds)",
            "Dispute/refund KPI row",
            "Filter bar (store/reason/date)",
            "Disputed orders data-table / card list",
            "Dispute detail + refund/adjustment controls (contextual)"
          ],
          "desktop": "KPI; two-pane: cancelled-orders table + detail drawer w/ existing controls",
          "mobile": "KPI 2-col; table->card list; detail full-screen; filters sheet",
          "primaryCTAs": [
            "Process refund",
            "Cancel / reverse order",
            "Adjust commission",
            "Resolve dispute"
          ],
          "charts": false
        },
        {
          "name": "Revenue Overview",
          "area": "5 Revenue overview",
          "sidebar": "Finance",
          "advancedOnly": true,
          "purpose": "Platform revenue, commissions, ledger",
          "sections": [
            "Page-header (Revenue Overview)",
            "Revenue KPI row",
            "Revenue trend chart",
            "Commissions table / card list",
            "Ledger & batches (advanced-only links)"
          ],
          "desktop": "KPI; revenue trend chart; commission table; ledger/batches deep links",
          "mobile": "KPI 2-col; compact chart; table->card list; ledger via link card",
          "primaryCTAs": [
            "Run commission batch",
            "Open General Ledger",
            "Export revenue report",
            "Adjust commission rate"
          ],
          "charts": true
        },
        {
          "name": "Inventory & Catalog Health",
          "area": "6 Inventory/catalog health",
          "sidebar": "Catalog",
          "purpose": "Cross-store catalog and stock health",
          "sections": [
            "Page-header (Catalog Health)",
            "Catalog KPI row",
            "Stock health breakdown",
            "Products data-table / card list",
            "Categories & Mega Offers (tabs)"
          ],
          "desktop": "KPI; health section-card; products table + filters; Categories/Offers sibling tabs",
          "mobile": "KPI 2-col; health stacked cards; table->card list; filters sheet; Categories/Offers stacked screens",
          "primaryCTAs": [
            "Filter low/out-of-stock",
            "Open product / stock",
            "Manage categories",
            "Create mega offer"
          ],
          "charts": false
        },
        {
          "name": "Support Activity",
          "area": "7 Support activity",
          "sidebar": "Community",
          "purpose": "Community + messaging operations",
          "sections": [
            "Page-header (Support Activity)",
            "Support KPI row",
            "Open Souk RFQ activity",
            "Direct message threads",
            "Thread preview (contextual)"
          ],
          "desktop": "KPI; split: Open Souk RFQ table + DM threads w/ unread badges; right-rail thread preview",
          "mobile": "KPI 2-col; Souk/Messages tabs; threads->card list; full-screen conversation; composer above safe-area",
          "primaryCTAs": [
            "Reply to thread",
            "Open RFQ",
            "Mark resolved",
            "Filter unanswered"
          ],
          "charts": false
        },
        {
          "name": "User & Seller Management",
          "area": "8 User/seller management",
          "sidebar": "Marketplace",
          "purpose": "Onboarding, verification, account control",
          "sections": [
            "Page-header (User & Seller Management)",
            "Tab strip (Requests / Profiles / Customers)",
            "Management KPI row",
            "Data-table / card list per tab",
            "Approval & verification detail (contextual)"
          ],
          "desktop": "Tab strip w/ badge counts; KPI; dense table per tab + row actions; approval detail panel",
          "mobile": "Tabs scroll-chips; KPI 2-col; card rows; approval full-screen; bulk via selection sheet",
          "primaryCTAs": [
            "Approve / reject store request",
            "Verify seller",
            "Set commission rate",
            "Suspend / activate account"
          ],
          "charts": false
        },
        {
          "name": "Alerts & Operational Exceptions Center",
          "area": "9 Alerts & exceptions",
          "sidebar": "Overview",
          "synthesized": "repurposes SidebarV3Composer badges (pending_orders, abandoned_carts, store_requests, unread_messages) + low-stock; no new entity/endpoint",
          "purpose": "Triage hub for everything needing attention",
          "sections": [
            "Page-header (Alerts & Exceptions)",
            "Severity summary chips (Critical/Warning/Info)",
            "Exception cards (orders/carts/store-requests/messages/stock)",
            "Recent exceptions timeline (contextual)"
          ],
          "desktop": "Severity-grouped section-cards w/ count + jump-to CTA; right-rail timeline",
          "mobile": "Cards stack single-column, severity color-coded; tappable deep-links; pull-to-refresh; sticky counts",
          "primaryCTAs": [
            "Jump to flagged orders",
            "Review pending store requests",
            "Open abandoned carts",
            "Resolve low-stock items"
          ],
          "charts": false
        }
      ]
    }
  },
  "designTokens": {
    "primary": "#4338ca (indigo-700), hover indigo-800",
    "accent": "#f59e0b (amber-500), soft amber-50/100/200",
    "semanticTints": {
      "pending/brand": "amber",
      "active/completed/success": "emerald",
      "abandoned/cancelled/error": "rose",
      "processing/info": "indigo",
      "neutral": "slate"
    },
    "radius": "rounded-2xl (16px) cards, rounded-full pills",
    "type": {
      "headlines": "Playfair Display (Latin only)",
      "bodyLatin": "Poppins",
      "arabic": "Rubik 600 incl. headlines"
    },
    "rtl": "logical properties only (inset-inline, margin-inline, padding-block/inline, start/end)",
    "components": [
      "x-v3.kpi-tile",
      "x-v3.section-card",
      "x-v3.data-table",
      "x-v3.badge",
      "x-v3.btn",
      "x-v3.toggle",
      "x-v3.avatar",
      "x-v3.empty-row",
      "x-v3.page-header",
      "new: x-v3.empty-card"
    ],
    "perfBudget": "Seller Light <3s on 4G; no charting library in Light bundle"
  },
  "modeSwitchUX": {
    "persistence": "UserPreference.dashboard_mode (fallback session), per user not per device; survives logout; missing -> derive from role",
    "reversible": "Advanced->Simple single tap no confirmation + toast; Simple->Advanced one-time explainer on first switch only",
    "explainBeforeSwitch": "first Simple->Advanced only; honest body; equal-weight buttons; Don't-show-again OFF by default",
    "midTaskSafety": "toggle disabled (tooltip) during unsaved forms / fulfillment / open chat",
    "antiDarkPattern": [
      "equal visual weight",
      "no nagging modals",
      "no FOMO/fear copy",
      "no trap on switch-back",
      "no data loss/gating",
      "no forced/auto upgrade",
      "honest preview",
      "ARIA segmented radiogroup, keyboard + SR labeled EN+AR"
    ],
    "i18nKeys": [
      "messages.seller_mode.group_label",
      "messages.seller_mode.simple",
      "messages.seller_mode.simple_long",
      "messages.seller_mode.simple_sub",
      "messages.seller_mode.advanced",
      "messages.seller_mode.advanced_long",
      "messages.seller_mode.advanced_sub",
      "messages.seller_mode.settings_row"
    ]
  }
}
```
