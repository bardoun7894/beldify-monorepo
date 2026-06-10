# i18n additions — FE-4 packet

New translation keys introduced in this packet. These were used via the
`t('key', 'English default')` pattern — they are NOT yet in any locale JSON.
Add these to `src/i18n/locales/*.json` as part of the i18n translation pass.

All keys use `{ defaultValue: '...' }` or inline second-arg fallbacks so the
UI renders correct English even before locale JSONs are updated.

---

## Checkout — shipping (Task 1)

| Key | English default | Used in |
|-----|----------------|---------|
| `checkout.shipping.methods.standard.free` | `Free` | `src/app/checkout/page.tsx` |

> Note: dynamic shipping method `name` and `delivery_time` are backend-supplied
> strings. Only the "Free" label is a local key.

---

## Checkout — address prefill (Task 2)

| Key | English default | Used in |
|-----|----------------|---------|
| `checkout.address.saved_addresses` | `Saved addresses` | `src/app/checkout/page.tsx` |
| `checkout.address.type_new` | `Enter a new address` | `src/app/checkout/page.tsx` |
| `checkout.address.default_badge` | `Default` | `src/app/checkout/page.tsx` |
| `checkout.address.save_for_next` | `Save this address for future orders` | `src/app/checkout/page.tsx` |

---

## Profile — Addresses tab (Task 3)

### Tab label

| Key | English default | Used in |
|-----|----------------|---------|
| `profile:tabs.addresses` | `Addresses` | `src/app/profile/components/ProfileTabs.tsx`, `src/app/profile/page.tsx` |

### AddressBook component (`src/app/profile/components/AddressBook.tsx`)

| Key | English default |
|-----|----------------|
| `profile:address_book.loading` | `Loading addresses` |
| `profile:address_book.load_error` | `Could not load addresses` |
| `profile:address_book.empty_hint` | `No saved addresses yet.` |
| `profile:address_book.empty_title` | `No saved addresses` |
| `profile:address_book.empty_body` | `Add an address to speed up checkout next time.` |
| `profile:address_book.count` | `{{count}} address(es) saved` |
| `profile:address_book.add_new` | `Add address` |
| `profile:address_book.add_heading` | `New address` |
| `profile:address_book.edit_heading` | `Edit address` |
| `profile:address_book.default_badge` | `Default` |
| `profile:address_book.set_default` | `Set as default` |
| `profile:address_book.edit_address` | `Edit address` |
| `profile:address_book.delete_address` | `Delete address` |
| `profile:address_book.address_labeled` | `{{label}} address` |
| `profile:address_book.address_unnamed` | `Saved address` |
| `profile:address_book.delete_confirm_title` | `Delete address?` |
| `profile:address_book.delete_confirm_body` | `This address will be permanently removed.` |
| `profile:address_book.create_success` | `Address saved` |
| `profile:address_book.update_success` | `Address updated` |
| `profile:address_book.delete_success` | `Address deleted` |
| `profile:address_book.save_error` | `Could not save address` |
| `profile:address_book.delete_error` | `Could not delete address` |
| `profile:address_book.default_success` | `Default address updated` |
| `profile:address_book.default_error` | `Could not update default` |
| `profile:address_book.fields.label` | `Label` |
| `profile:address_book.fields.label_placeholder` | `Home, Work…` |
| `profile:address_book.fields.street` | `Street address` |
| `profile:address_book.fields.apartment` | `Apartment, suite, etc.` |

### Reused profile field keys (already in profile namespace)

These are already present in the profile i18n namespace — no new entries needed:
- `profile:fields.first_name`, `profile:fields.last_name`
- `profile:fields.email`, `profile:fields.phone`
- `profile:fields.city`, `profile:fields.state`
- `profile:fields.postal_code`, `profile:fields.country`
- `profile:fields.select_country`

### Reused common keys (already in common namespace)

- `common:optional`, `common:cancel`, `common:close`, `common:delete`
- `common:saving`, `common:save_changes`, `common:edit`, `common:deleting`

---

## Field-mapping assumptions — reconcile with BE-3 report

The addressService (`src/services/addressService.ts`) isolates ALL field-name
mapping. Assumptions made that may need updating after BE-3 reports:

| Assumption | Reason to check |
|------------|----------------|
| Backend returns `addresses` array under `data.addresses` | Standard pattern; BE may use `data.data` or `data` directly |
| Created address returned under `data.address` (singular) | BE may return `data.data` or the address inline |
| `postal_code` field name | BE may use `zip_code` (normaliseAddress handles both via `raw.postal_code ?? raw.zip_code`) |
| `state` field may be absent on some records | Already guarded with `?? undefined` |
| `POST /{id}/default` for set-default | BE may use `PUT` or a `?default=1` query param |
| Shipping method id strings: `standard`, `express`, `pickup` | BE may use different IDs — update shippingService fallback IDs if needed |
