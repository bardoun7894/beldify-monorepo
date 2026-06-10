'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import toast from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import RelatedProducts from '@/components/products/RelatedProducts';
import CartItemRow from '@/components/cart/CartItemRow';
import OrderSummaryCard from '@/components/cart/OrderSummaryCard';
import EmptyCartState from '@/components/cart/EmptyCartState';
import CartMobileBar from '@/components/cart/CartMobileBar';
import { usePWATriggers } from '@/hooks/usePWATriggers';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  BadgeCheck,
  Headphones,
  Sparkles,
} from 'lucide-react';


const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

export default function CartPage() {
  const {
    state,
    loading,
    isInitialLoading,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { triggerOnCartAdd } = usePWATriggers();

  // Trigger PWA prompt when user has items in cart
  React.useEffect(() => {
    if (state?.items?.length && state.items.length > 0) {
      triggerOnCartAdd();
    }
  }, [state?.items?.length]);

  // Coupon state
  const [couponCode, setCouponCode] = React.useState('');

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      // @ts-expect-error Known issue with toast translation
      toast.error(t('cart.coupon.enter_code', 'Please enter a promo code'));
      return;
    }
    try {
      await applyCoupon(code);
      setCouponCode('');
    } catch {
      // Errors handled in context via toast
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
    } catch {
      // Errors handled in context via toast
    }
  };

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeFromCart(itemId);
    } else {
      await updateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!state?.items || state.items.length === 0) {
      toast.error(t('cart.empty.title', 'Your bag is empty'));
      return;
    }
    router.push('/checkout');
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (isInitialLoading || state === null) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="animate-pulse space-y-6">
            {/* Breadcrumb skeleton */}
            <div className="h-4 bg-gray-100 rounded-full w-40" />
            {/* Title skeleton */}
            <div className="h-10 bg-gray-100 rounded-2xl w-52" />
            <div className="h-4 bg-gray-100 rounded-full w-36" />

            {/* Two-col skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex gap-4 bg-white ring-1 ring-indigo-100 rounded-2xl p-4 shadow-atlas-sm"
                  >
                    <div className="w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-3 pt-1">
                      <div className="h-5 bg-gray-100 rounded w-3/4" />
                      <div className="h-3.5 bg-gray-100 rounded w-1/2" />
                      <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white ring-1 ring-indigo-100 rounded-2xl p-6 h-72 shadow-atlas-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (state.items.length === 0) {
    return (
      <div className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`}>
        <EmptyCartState />
        <ReassuranceStrip t={t} />
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <RelatedProducts isCartPage={true} limit={4} />
        </div>
      </div>
    );
  }

  // ── Filled cart ──────────────────────────────────────────────────────────────
  const itemCount = state.items.length;
  const subtotal = state.subtotal ?? 0;
  const shippingAmount = state.shipping_amount ?? 0;
  const taxAmount = state.tax_amount ?? 0;
  const discountAmount = state.discount_amount ?? 0;
  const totalAmount = state.total_amount ?? 0;

  return (
    <div className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <header className="bg-gray-50 border-b border-indigo-100 pt-8 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb — logical CSS, no left/right */}
          <nav className="flex items-center gap-2 text-sm text-indigo-400 mb-6" aria-label={t('nav.breadcrumb', 'Breadcrumb')}>
            <Link href="/" className="hover:text-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rounded">
              {t('nav.home', 'Home')}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-indigo-900 font-medium">{t('nav.cart', 'Cart')}</span>
          </nav>

          <h1
            className="text-3xl sm:text-4xl font-bold text-indigo-950 mb-2"
            style={playfair}
          >
            {t('cart.heading', 'Your bag')}
          </h1>
          <p className="text-indigo-600 text-base">
            {t('cart.subtitle', '{{count}} items · ready when you are', { count: itemCount })}
          </p>
        </div>
      </header>

      {/* ── Main 2-column grid ──────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: cart items ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {state.items.map((item) => {
              // RTL: product title needs font-arabic when isRTL; skip Playfair (no Arabic glyphs).
              // Free-shipping and discount display use text-[#855300] for WCAG AA on white.
              const itemTitleClass = `text-base font-semibold text-indigo-950 hover:text-indigo-700 transition-colors leading-snug line-clamp-2${isRTL ? ' font-arabic' : ''}`;
              const itemTitleStyle = isRTL ? undefined : playfair;
              return (
                <CartItemRow
                  key={item.id}
                  item={item}
                  loading={loading}
                  onQuantityChange={handleQuantityChange}
                  onRemove={removeFromCart}
                  titleClassName={itemTitleClass}
                  titleStyle={itemTitleStyle}
                />
              );
            })}

            {/* Continue shopping */}
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-900 transition-colors group focus:outline-none focus:ring-2 focus:ring-indigo-700/30 rounded"
              >
                {/* Start-ward arrow: ArrowRight points start-ward under RTL, ArrowLeft under LTR.
                    Hover nudge is logical — always toward the start edge. */}
                {isRTL ? (
                  <ArrowRight
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowLeft
                    className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                )}
                {t('cart.continue_shopping', 'Continue shopping')}
              </Link>
            </div>
          </div>

          {/* ── Right: order summary (stacks on mobile, sticky sidebar on desktop) ── */}
          {/* Free-shipping/discount values use text-[#855300] (WCAG AA on white, ~4.7:1) */}
          <div className="lg:col-span-1">
            <OrderSummaryCard
              subtotal={subtotal}
              shippingAmount={shippingAmount}
              taxAmount={taxAmount}
              discountAmount={discountAmount}
              totalAmount={totalAmount}
              couponCode={state.coupon_code}
              couponInputValue={couponCode}
              onCouponInputChange={setCouponCode}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              onCheckout={handleCheckout}
              loading={loading}
            />
          </div>
        </div>
      </main>

      {/* ── Reassurance strip ────────────────────────────────────────────────── */}
      <ReassuranceStrip t={t} />

      {/* ── Cross-sell: Complete the look ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-10" aria-labelledby="cross-sell-heading">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200">
            <Sparkles size={12} className="shrink-0" aria-hidden="true" />
            {t('cart.aiSuggestions', 'Complete the look')}
          </span>
        </div>
        <h2
          id="cross-sell-heading"
          className="text-2xl sm:text-3xl font-bold text-indigo-950 mb-8"
          style={playfair}
        >
          {t('cart.also_like', 'You might also like')}
        </h2>
        <RelatedProducts isCartPage={true} limit={4} />
      </section>

      {/* ── Bespoke editorial strip ──────────────────────────────────────────── */}
      <section className="bg-indigo-900 py-16 relative overflow-hidden" aria-labelledby="bespoke-heading">
        <div
          className="absolute inset-0 opacity-25"
          aria-hidden="true"
          style={{
            // Atlas palette: amber-500 (#f59e0b) + indigo-700 (#4338ca) glow over the indigo-900 strip
            background:
              'radial-gradient(circle at 20% 20%, #f59e0b 0, transparent 45%), radial-gradient(circle at 80% 60%, #4338ca 0, transparent 50%)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center flex flex-col md:flex-row items-center justify-center gap-8">
          <h2
            id="bespoke-heading"
            className="text-3xl md:text-4xl font-bold text-white"
            style={playfair}
          >
            {t('cart.bespoke.headline', 'Want it tailored to you?')}
          </h2>
          <Link
            href="/bespoke"
            className="inline-flex items-center justify-center px-8 py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-full transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 shadow-atlas-sm"
          >
            {t('cart.bespoke.cta', 'Book a consultation')}
          </Link>
        </div>
      </section>

      {/* ── Mobile sticky bar (order summary on small screens) ──────────────── */}
      <CartMobileBar
        totalAmount={totalAmount}
        itemCount={itemCount}
        onCheckout={handleCheckout}
        loading={loading}
      />

      {/* Bottom spacer for mobile bar */}
      <div className="h-20 md:hidden" aria-hidden="true" />
    </div>
  );
}

// ── Reassurance strip sub-component ─────────────────────────────────────────
function ReassuranceStrip({ t }: { t: (key: string, fallback: string) => string }) {
  const items = [
    {
      icon: <ShieldCheck className="w-7 h-7 text-indigo-600" aria-hidden="true" />,
      label: t('cart.reassurance.verified', 'Verified Sellers'),
    },
    {
      // Returns reassurance lives once, next to the checkout CTA (OrderSummaryCard).
      // Here we surface a complementary signal instead of repeating it.
      icon: <Truck className="w-7 h-7 text-indigo-600" aria-hidden="true" />,
      label: t('cart.reassurance.delivery', 'Nationwide delivery'),
    },
    {
      icon: <BadgeCheck className="w-7 h-7 text-indigo-600" aria-hidden="true" />,
      label: t('cart.reassurance.authentic', 'Authentic Moroccan craft'),
    },
    {
      icon: <Headphones className="w-7 h-7 text-indigo-600" aria-hidden="true" />,
      label: t('cart.reassurance.support', 'Support AR/FR/EN'),
    },
  ];

  return (
    <section className="bg-indigo-50/40 border-y border-indigo-100 py-12 px-6" aria-label={t('cart.reassurance.label', 'Shopping assurance')}>
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {items.map(({ icon, label }) => (
          <div key={label} className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 ring-1 ring-indigo-200 shadow-atlas-sm">
              {icon}
            </div>
            <p className="text-sm font-medium text-indigo-800">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
