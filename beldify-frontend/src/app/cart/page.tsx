'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/utils/imageUtils';
import { useCart } from '@/contexts/CartContext';
import toast from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import RelatedProducts from '@/components/products/RelatedProducts';
import ShippingCalculator from '@/components/cart/ShippingCalculator';
import { usePWATriggers } from '@/hooks/usePWATriggers';
import {
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  BadgeCheck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  AlertTriangle,
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
      <div className="min-h-screen bg-amber-50/40">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-amber-100 rounded-full w-32" />
            <div className="h-10 bg-amber-100 rounded-2xl w-56" />
            <div className="h-5 bg-amber-100 rounded-full w-40" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex gap-4 bg-white ring-1 ring-amber-200 rounded-2xl p-4"
                  >
                    <div className="w-24 h-24 bg-amber-100 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-amber-100 rounded w-3/4" />
                      <div className="h-4 bg-amber-100 rounded w-1/2" />
                      <div className="h-4 bg-amber-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white ring-1 ring-amber-200 rounded-2xl p-6 h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (state.items.length === 0) {
    return (
      <div className={`min-h-screen bg-amber-50/40 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Empty hero */}
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-50 ring-2 ring-amber-200 mb-8">
            <ShoppingBag className="w-10 h-10 text-amber-500" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            style={playfair}
          >
            {t('cart.empty.heading', 'Your bag is empty.')}
          </h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            {t('cart.empty.subtitle', 'Find something timeless to wear.')}
          </p>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3 px-8 text-sm font-semibold transition-colors"
          >
            {t('cart.empty.cta', 'Browse the souk')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Reassurance strip */}
        <ReassuranceStrip t={t} />

        {/* You might also like */}
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
    <div className={`min-h-screen bg-amber-50/40 ${isRTL ? 'rtl' : 'ltr'}`}>

      {/* ── Page header strip ───────────────────────────────────────────────── */}
      <header className="bg-amber-50/40 border-b border-amber-200/60 pt-8 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-indigo-700 transition-colors">
              {t('nav.home', 'Home')}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{t('nav.cart', 'Cart')}</span>
          </nav>

          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2"
            style={playfair}
          >
            {t('cart.heading', 'Your bag')}
          </h1>
          <p className="text-gray-500 text-base">
            {t('cart.subtitle', `${itemCount} items · ready when you are`, { count: itemCount })}
          </p>
        </div>
      </header>

      {/* ── Main 2-column grid ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left col: cart items ──────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {state.items.map((item) => {
              const productName =
                i18n.language === 'ar' ? item.product.name_ar : item.product.name;
              const lineTotal = (item.unit_price * item.quantity).toFixed(2);
              const hasDiscount =
                item.product.price &&
                item.product.price > item.unit_price;

              return (
                <article
                  key={item.id}
                  className="bg-white ring-1 ring-amber-200 rounded-2xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Product image */}
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-xl ring-1 ring-amber-200 overflow-hidden bg-amber-50">
                      <Image
                        src={getImageUrl(item.product.image_url, '/placeholder.png')}
                        alt={productName}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {/* Name */}
                          <Link href={`/products/${item.product.id}`}>
                            <h3
                              className="text-lg font-semibold text-gray-900 hover:text-indigo-700 transition-colors leading-tight truncate"
                              style={playfair}
                            >
                              {productName}
                            </h3>
                          </Link>

                          {/* Size + color */}
                          {(item.product.color || item.product.size) && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              {[item.product.color, item.product.size]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}

                          {/* Seller chip */}
                          {item.store?.name && (
                            <span className="inline-flex items-center gap-1 mt-2 bg-amber-50 ring-1 ring-amber-200 rounded-full px-3 py-1 text-xs text-amber-700 font-medium">
                              <BadgeCheck className="w-3 h-3" />
                              {item.store.name}
                            </span>
                          )}
                        </div>

                        {/* Price block + remove */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through">
                              {item.product.price.toFixed(2)} MAD
                            </span>
                          )}
                          <span className="text-base font-semibold text-indigo-700">
                            {lineTotal} MAD
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            aria-label={t('cart.items.remove', 'Remove item')}
                            className="mt-1 p-1.5 text-gray-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Quantity stepper */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="inline-flex items-center bg-amber-50 rounded-full px-1 py-1 gap-1">
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                            aria-label={t('cart.quantity.decrease', 'Decrease quantity')}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-indigo-700 transition-colors rounded-full hover:bg-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                            disabled={
                              item.product.stock_quantity !== undefined &&
                              item.quantity >= item.product.stock_quantity
                            }
                            aria-label={t('cart.quantity.increase', 'Increase quantity')}
                            className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-indigo-700 transition-colors rounded-full hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Low stock warning */}
                        {item.product.stock_quantity !== undefined &&
                          item.quantity >= item.product.stock_quantity * 0.8 && (
                            <p
                              className="text-xs text-amber-600 flex items-center gap-1"
                              role="status"
                              aria-live="polite"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {item.quantity >= item.product.stock_quantity
                                ? t('cart.stock.max', 'Max quantity reached')
                                : t('cart.stock.low', `Only ${
                                    item.product.stock_quantity - item.quantity
                                  } left`, {
                                    remaining:
                                      item.product.stock_quantity - item.quantity,
                                  })}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {/* Continue shopping */}
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-900 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                {t('cart.continue_shopping', 'Continue shopping')}
              </Link>
            </div>
          </div>

          {/* ── Right col: order summary ──────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white ring-1 ring-amber-200 rounded-2xl p-6 lg:sticky lg:top-24">
              {/* Kicker */}
              <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-4">
                {t('cart.summary.kicker', 'Order Summary')}
              </p>

              {/* Price rows */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t('cart.summary.subtotal', 'Subtotal')}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {subtotal.toFixed(2)} MAD
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t('cart.summary.shipping', 'Shipping')}
                  </span>
                  {shippingAmount > 0 ? (
                    <span className="text-gray-900 font-medium">
                      {shippingAmount.toFixed(2)} MAD
                    </span>
                  ) : subtotal >= 500 ? (
                    <span className="text-amber-600 font-medium">
                      {t('cart.summary.free', 'Free')}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>

                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t('cart.summary.tax', 'Tax')}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {taxAmount.toFixed(2)} MAD
                    </span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t('cart.summary.discount', 'Discount')}
                    </span>
                    <span className="text-amber-600 font-medium">
                      -{discountAmount.toFixed(2)} MAD
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-amber-200 my-4" />

              {/* Total */}
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-gray-700 font-medium text-sm">
                  {t('cart.summary.total', 'Total')}
                </span>
                <span
                  className="text-2xl font-bold text-indigo-700"
                  style={playfair}
                >
                  {totalAmount.toFixed(2)} MAD
                </span>
              </div>

              {/* Promo code */}
              {!state.coupon_code ? (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder={t('cart.coupon.placeholder', 'Promo code')}
                    className="flex-1 rounded-full bg-amber-50 ring-1 ring-amber-200 px-4 py-2 text-sm focus:outline-none focus:ring-amber-400 transition"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={loading || !couponCode.trim()}
                    className="rounded-full bg-white ring-1 ring-amber-400 text-amber-700 px-4 py-2 text-sm font-semibold hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('cart.coupon.apply', 'Apply')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 ring-1 ring-amber-200 mb-4">
                  <span className="text-sm text-amber-700 font-medium">
                    {state.coupon_code}{' '}
                    {t('cart.coupon.applied_label', 'applied')}
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    disabled={loading}
                    className="text-sm text-rose-600 hover:text-rose-700 font-medium disabled:opacity-50"
                  >
                    {t('cart.coupon.remove', 'Remove')}
                  </button>
                </div>
              )}

              {/* Shipping calculator */}
              <div className="mb-5">
                <ShippingCalculator subtotal={subtotal} />
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckout}
                className="w-full bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t('cart.summary.checkout', 'Checkout')}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust micro-row */}
              <div className="flex justify-center gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-amber-50 ring-1 ring-amber-200 rounded-full px-3 py-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  {t('cart.trust.secure', 'Secure payments')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-amber-50 ring-1 ring-amber-200 rounded-full px-3 py-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  {t('cart.trust.returns', 'Free 14-day returns')}
                </span>
              </div>

              {/* Payment methods footer */}
              <p className="text-center text-xs text-gray-400 mt-3">
                {t(
                  'cart.payment_methods',
                  'We accept Visa · Mastercard · Cash on Delivery',
                )}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Reassurance strip ──────────────────────────────────────────────── */}
      <ReassuranceStrip t={t} />

      {/* ── You might also like ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        {/* expect: AI "Complete the look" chip visible above cross-sell heading when cart has items */}
        <div className="flex items-center gap-2 mt-8 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium ring-1 ring-amber-200">
            <Sparkles size={12} className="shrink-0" />
            {t('cart.aiSuggestions', 'Complete the look')}
          </span>
        </div>
        <h2
          className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8"
          style={playfair}
        >
          {t('cart.also_like', 'You might also like')}
        </h2>
        <RelatedProducts isCartPage={true} limit={4} />
      </section>

      {/* ── Bespoke strip ──────────────────────────────────────────────────── */}
      <section className="bg-indigo-900 py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, #f59e0b 0, transparent 45%), radial-gradient(circle at 80% 60%, #6366f1 0, transparent 50%)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center flex flex-col md:flex-row items-center justify-center gap-8">
          <h2
            className="text-3xl md:text-4xl font-bold text-white"
            style={playfair}
          >
            {t('cart.bespoke.headline', 'Want it tailored to you?')}
          </h2>
          <Link
            href="/bespoke"
            className="inline-flex items-center justify-center px-8 py-3 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold rounded-full transition-colors text-sm"
          >
            {t('cart.bespoke.cta', 'Book a consultation')}
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── Reassurance strip sub-component ─────────────────────────────────────────
function ReassuranceStrip({ t }: { t: (key: string, fallback: string) => string }) {
  const items = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-amber-500" />,
      label: t('cart.reassurance.verified', 'Verified Sellers'),
    },
    {
      icon: <RotateCcw className="w-8 h-8 text-amber-500" />,
      label: t('cart.reassurance.returns', 'Free Returns'),
    },
    {
      icon: <BadgeCheck className="w-8 h-8 text-amber-500" />,
      label: t('cart.reassurance.authentic', 'Authentic Moroccan craft'),
    },
    {
      icon: <Headphones className="w-8 h-8 text-amber-500" />,
      label: t('cart.reassurance.support', 'Support AR/FR/EN'),
    },
  ];

  return (
    <section className="bg-amber-50/60 border-y border-amber-200/50 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {items.map(({ icon, label }) => (
          <div key={label} className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-amber-100 ring-1 ring-amber-200">
              {icon}
            </div>
            <p className="text-sm font-medium text-gray-700">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
