# Beldify Dual-Mode — Visual Reference (user-supplied)

> Reference image: `design/reference/orders-dashboard-reference.webp`
> **Rule: adopt this layout/spacing/component language for BOTH mobile and desktop, but KEEP the Beldify brand colors** — Atlas Indigo `#4338ca` (primary, hover `indigo-800`) + Saffron Amber `#f59e0b` (accent). Do **not** use the reference's generic blue (`#2563eb`). This is a visual-language reference, not a color reference.

This reference is fully consistent with `design/dual-mode-dashboard.md` — it just makes the look concrete. Apply with V3 components + Atlas tokens.

---

## 1. Card language (list items) — Light mode lists

Matches the reference's left-rail job cards. Used for **Orders (Light)**, **Products (Light)**, **Open Souk (Light)**, message previews.

- White surface, `rounded-2xl`, `ring-1 ring-amber-200/60`, `shadow-sm`, hover lift `translateY(-2px)` + soft indigo shadow (respect `prefers-reduced-motion`).
- **Leading icon chip**: rounded-square (`rounded-xl`, ~`w-12 h-12`), solid brand tint fill + white glyph. Use the **semantic tint map** (amber=pending/brand, emerald=active/completed, rose=cancelled/returned, indigo=processing/info, slate=neutral) — NOT rainbow per-item logos like the reference.
- **Title** (semibold, ink) + **sub-line** (muted slate: customer / address / SKU / meta).
- **Tag pills** bottom-start: rounded-full, soft tinted (`bg-{tint}-50 text-{tint}-700`) — e.g. status, level, fulfillment. Mirror the reference's "Full Time / Middle Level" pills.
- **Timestamp / amount** bottom-end, muted, small.
- Generous padding (`tw-p-4`/`tw-p-5`), comfortable gaps. Soft density.

→ build as / extend `<x-v3.section-card>` + `<x-v3.badge>`; add a `list-card` recipe in `seller-shell.css` if needed.

## 2. Segmented tabs with COUNT BADGES

Matches "All orders `88` · Pickups `61` · Returns `27`".

- Horizontal tab row, active tab = indigo-700 text + 2px indigo underline; inactive = slate.
- Each tab label followed by a **count pill** (`rounded-full`, soft bg). Active count pill = `bg-indigo-600 text-white`; inactive = `bg-slate-100 text-slate-600`; alert counts (Returns/cancelled) = amber/rose.
- Use for: **Orders** status tabs (All / Needs action / Returns & Refunds), **Products** (Listing / Inventory Insights), **Souk** (Open requests / My responses).
- Mobile: horizontal **scroll-chips**, same count badges, momentum scroll, no wrap.

## 3. Toolbar row: Sort · Filters · Search

Matches the mobile "↕ Sort ⌄ | ⨯ Filters ⌄ | 🔍" row and desktop pill filter fields (Location / Job Type / Salary Range).

- **Desktop**: pill-shaped fields, `rounded-full`/`rounded-xl`, leading icon + label, `ring-1 ring-slate-200`, white bg. Inline filter bar. (Advanced/Heavy only — Light shows ≤1 inline filter.)
- **Mobile**: compact pill buttons (Sort ⌄, Filters ⌄) + icon-only search button; tapping opens a **bottom sheet** for sort/filter options (full-screen on small viewports).
- Results meta line under the toolbar: `21–30 of 88 results` (start) + `Items per page [10 ⌄]` (end). Heavy only.

## 4. Mobile detail rows — key→value list

Matches the mobile Orders body (Order ID No. / Customer / Product / Status / Price / Created date / Delivery status).

- Each row: **label** (start, muted slate) ↔ **value** (end, ink, medium weight). `justify-between`, `py-2.5`, comfortable line-height.
- **Status** value rendered as a `<x-v3.badge>` pill: Rejected/cancelled = rose, Completed = emerald, Processing = indigo, Pending = amber.
- Delivery/secondary status = dot + label (`• Received`) in indigo.
- Divider (`border-t border-slate-100`) between order blocks. This is the **mobile-first row pattern** for Orders/Order detail; on desktop these become `<x-v3.data-table>` rows (Heavy) or the card layout (Light).

## 5. Top bar / user chip (desktop)

Matches "Enterprise · Resources ⌄ … 🔔 [avatar] Cody Fisher / email ⌄".

- Brand + nav start; icon actions (notifications bell w/ dot) + **rich user chip** end: avatar + name + (optional email) + chevron.
- Our `seller_shell` topbar already has brand + pill nav + bell + language + user chip + (new) **Simple/Advanced toggle**. Enrich the user chip to avatar + name (email optional on desktop ≥1024px). Toggle stays inline-end before the chip. RTL: mirror via logical props.

## 6. Mobile app-bar

Reference shows a solid colored app-bar (hamburger · title · avatar). On-brand = **indigo-700** app-bar is acceptable, but our shell currently uses a light brand bar + bottom 5-tab nav — keep the bottom-nav skeleton (it's frozen). If a screen uses a colored mobile header, use indigo-700 with white content, `viewport-fit=cover` + safe-area.

---

## Brand color substitution map (reference → Beldify)
| Reference | Use instead |
|---|---|
| Primary blue `#2563eb` (tabs, links, active, mobile app-bar) | Atlas Indigo `#4338ca` (hover `#3730a3`) |
| Blue count badge | indigo-600 active / slate-100 inactive |
| Rose "Rejected" | keep rose (`rose-100/700`) — our cancelled/returned tint |
| Green "Completed" | keep emerald — our completed/active tint |
| Neutral grays | Atlas slate + warm amber-200 hairlines on cards |

## Anti-patterns (still apply)
No generic blue→cyan gradients, no neon, no charts in Light, no dense tables for beginners, logical RTL props only, ≥44px touch targets.
