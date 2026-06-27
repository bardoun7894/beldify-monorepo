# Plan — 010 Dual-role seller-buyer i18n polish

## Approach

Mechanical i18n key addition. No architecture decisions, no code logic changes. The plan shipped in the `frontend-page` build phase is authoritative and pre-approved; this plan restates it for the KB archive.

## Keys (4 × 7 = 28 key-value additions)

### `navigation.seller_dashboard` — append after `navigation.openSouk` (last key in block)

| Locale | Value |
|---|---|
| en | Seller Dashboard |
| ar | لوحة تحكم البائع |
| ma | لوحة التحكم ديالي البايع |
| fr | Tableau de bord vendeur |
| es | Panel del Vendedor |
| nl | Verkopersdashboard |
| de | Verkäufer-Dashboard |

### `seller.shortcut_title` / `shortcut_body` / `shortcut_cta` — insert as first three keys of top-level `seller` block (common ns)

| Key | en | ar | ma | fr | es | nl | de |
|---|---|---|---|---|---|---|---|
| shortcut_title | Seller Dashboard | لوحة تحكم البائع | لوحة التحكم ديالي البايع | Tableau de bord vendeur | Panel del Vendedor | Verkopersdashboard | Verkäufer-Dashboard |
| shortcut_body | Manage your store, products and orders | أدر متجرك ومنتجاتك وطلباتك | أدّر المتجر ديالك والمنتجات والطلبات | Gérez votre boutique, vos produits et vos commandes | Gestiona tu tienda, productos y pedidos | Beheer je winkel, producten en bestellingen | Verwalten Sie Ihren Shop, Ihre Produkte und Bestellungen |
| shortcut_cta | Open dashboard | فتح اللوحة | افتح اللوحة | Ouvir le tableau de bord | Abrir el panel | Dashboard openen | Dashboard öffnen |

`ma` values use Darija phrasing (precedent: existing `customOrders.seller_dashboard` ma value "لوحة التحكم ديالي البايع"), not MSA.

## Edits (exact, repeatable per file)

1. Replace `"openSouk": "<val>"\n  },` → `"openSouk": "<val>",\n    "seller_dashboard": "<val>"\n  },`.
2. Replace `"seller": {\n    "register": {` → `"seller": {\n    "shortcut_title": "...",\n    "shortcut_body": "...",\n    "shortcut_cta": "...",\n    "register": {`.

Both oldTexts are unique per file (openSouk is the last navigation key; `"seller": {` at indent 2 is top-level only — the nested `home.seller` block in ma/fr/es sits at indent 4).

## Verification

1. `cd beldify-frontend && python3 -c "import json;[json.load(open(f'src/i18n/locales/{l}.json')) for l in ['en','ar','ma','fr','es','nl','de']]"` — JSON validity.
2. `npm run lint`.
3. `npx tsc --noEmit`.
4. `npm run build:dev`.
5. Programmatic check that all 4 keys exist in all 7 locales under correct parents.

## Risk

- Low. Worst case: a stray trailing comma breaks JSON parse at module load → app blank. Mitigated by programmatic JSON validity check before lint/build.
- Inline `defaultValue` fallbacks remain in TSX as dead-branches (deliberate defensive pattern; not removed).
