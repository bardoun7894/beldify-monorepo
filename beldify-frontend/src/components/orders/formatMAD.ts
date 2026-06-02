/**
 * Single source of truth for MAD price formatting across the Orders screens.
 *
 * Both the list (`/orders`) and detail (`/orders/[orderNumber]`) screens render
 * money. Previously the list used `Intl` decimal + a literal "MAD" string while
 * the detail page formatted with the currency Intl style, which emits the
 * locale currency glyph (Arabic «د.م.‏») — so the same price read differently on
 * each screen.
 *
 * This util standardises on the storefront convention used everywhere else
 * (PDP, cart, checkout, ProductCard): a localized decimal amount followed by a
 * literal "MAD" suffix. Render the result inside a `.currency-mad` span so the
 * numeral group + suffix stay bidi-isolated under `dir="rtl"`.
 *
 * Lives outside a component, so the caller passes the active locale explicitly.
 */
export function formatMAD(
  amount: number | string | null | undefined,
  locale: string = 'en',
): string {
  const n = Number(amount);
  const safe = amount === null || amount === undefined || isNaN(n) ? 0 : n;
  const formatted = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
  return `${formatted} MAD`;
}

export default formatMAD;
