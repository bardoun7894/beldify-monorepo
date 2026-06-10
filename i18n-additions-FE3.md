# i18n additions — PACKET FE-3 (seller dashboard)

All keys use `t('key', { defaultValue: '...' })` pattern.
FORBIDDEN to write directly to `src/i18n/locales/*.json` — add translations there separately.

---

## sellerProductService / product edit page
`src/app/seller/products/[id]/edit/page.tsx`

| Key | Default (EN) | Notes |
|-----|-------------|-------|
| `seller.product.edit_title` | `Edit Product` | Page <h1> |
| `seller.product.edit_submit_cta` | `Save changes` | Submit button |
| `seller.product.update_success` | `Product updated successfully` | Toast on PUT success |
| `seller.product.update_error` | `Could not update product. Please try again.` | Toast on generic error |
| `seller.product.fetch_error` | `Could not load product details.` | Error banner |
| `seller.product.not_found` | `Product not found or you do not have permission to edit it.` | 404 error banner |
| `seller.product.suspended_error` | `Your account is suspended. Contact support to resolve.` | 403 error banner |
| `seller.product.edit_eyebrow` | `Inventory` | Eyebrow label |

---

## Products list edit affordance
`src/app/seller/products/page.tsx`

| Key | Default (EN) | Notes |
|-----|-------------|-------|
| `seller.products.edit_aria` | `Edit {{name}}` | aria-label on Edit link (interpolated) |
| `common.edit` | `Edit` | Shared "Edit" link text |
| `common.actions` | `Actions` | sr-only th label |

---

## Store settings — real load/save
`src/app/seller/store-settings/page.tsx`

| Key | Default (EN) | Notes |
|-----|-------------|-------|
| `seller.store_settings.profile_section_title` | `Store Profile` | Section heading |
| `seller.store_settings.profile_section_desc` | `Update your public store information.` | Section description |
| `seller.store_settings.label_name` | `Store name` | Input label |
| `seller.store_settings.label_email` | `Business email` | Input label |
| `seller.store_settings.label_description` | `Store description` | Textarea label |
| `seller.store_settings.label_phone` | `Phone number` | Input label |
| `seller.store_settings.label_address` | `Address` | Input label |
| `seller.store_settings.save_cta` | `Save profile` | Save button |
| `seller.store_settings.saving` | `Saving…` | Save button loading state |
| `seller.store_settings.saved_indicator` | `Saved` | Inline success indicator |
| `seller.store_settings.save_success` | `Store profile saved` | Toast on success |
| `seller.store_settings.save_error` | `Could not save profile. Please try again.` | Toast on generic error |
| `seller.store_settings.validation_error` | `Please fix the errors below and try again.` | Alert above form on 422 |
| `seller.store_settings.fetch_error` | `Could not load store profile.` | Error banner on mount |

---

## Seller nav — Messages
`src/app/seller/layout.tsx`

| Key | Default (EN) | Notes |
|-----|-------------|-------|
| `seller.nav.messages` | `Messages` | Nav item label |

NOTE: Unread badge omitted. `getUnreadCount()` in `messagingService.ts` is buyer-scoped
(`/api/v1/buyer/messages/unread-count`). No seller-scoped unread count endpoint found in
`src/services/`. Add badge when a seller-scoped endpoint ships.

---

## Dashboard — empty states + onboarding nudge
`src/app/seller/page.tsx`

| Key | Default (EN) | Notes |
|-----|-------------|-------|
| `seller.dashboard.no_orders` | `No orders yet — share your store to get started!` | Orders empty state body |
| `seller.dashboard.add_first_product_cta` | `Add your first product` | CTA link in orders empty state |
| `seller.dashboard.earnings_error` | `Could not load earnings data.` | Earnings error fallback |
| `seller.dashboard.eyebrow` | `Seller Hub` | Page eyebrow |
| `seller.dashboard.title` | `Dashboard` | Page <h1> |
| `seller.dashboard.kpi_gross` | `Gross Revenue` | KPI card label |
| `seller.dashboard.kpi_net` | `Net Revenue` | KPI card label |
| `seller.dashboard.kpi_orders` | `Orders` | KPI card label |
| `seller.dashboard.kpi_commission` | `Commission` | KPI card label |
| `seller.dashboard.recent_orders` | `Recent Orders` | Section heading |
| `seller.dashboard.view_all_orders` | `View all orders` | Link |
