'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cartService } from '@/services/api';
import { useCart } from '@/contexts/CartContext';
import toast from '@/utils/toast';
import { orderService, type Order } from '@/services/orderService';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import logger from '@/utils/consoleLogger';
import { usePWATriggers } from '@/hooks/usePWATriggers';
import { getImageUrl } from '@/utils/imageUtils';
import { shippingService, type ShippingMethod } from '@/services/shippingService';
import { addressService, type SavedAddress } from '@/services/addressService';
import {
  ShoppingBag,
  ArrowRight,
  User,
  Phone,
  MapPin,
  Hash,
  Mail,
  Truck,
  Zap,
  Store,
  ShieldCheck,
  RotateCcw,
  BadgeCheck,
  Headphones,
  Check,
  ChevronDown,
  BookUser,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';
import { CheckoutProgressBar } from '@/components/checkout/CheckoutProgressBar';

// ── Playfair inline style token ───────────────────────────────────────────────
const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

// ── Shipping config — LEGACY FALLBACK CONSTANTS ──────────────────────────────
// These are now the fallback only. Live values come from shippingService.getMethods().
// Kept here so the order-summary FREE badge and quote comparison still compile.
const FREE_SHIPPING_THRESHOLD = 500;

// ── Quote shape ───────────────────────────────────────────────────────────────

/**
 * Per-seller breakdown returned by the quote endpoint when cart spans >1 store.
 * Plan.md FR-017 contract: { store_id, store_name, subtotal, shipping_amount,
 *   tax_amount, discount_amount, items[] }
 */
interface PerSellerQuote {
  store_id: number;
  store_name?: string;
  subtotal: number;
  shipping_amount: number;
  tax_amount?: number;
  discount_amount?: number;
  item_count?: number;
}

interface CheckoutQuote {
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  cod_allowed: boolean;
  cod_max: number;
  currency: string;
  /**
   * NEW (plan.md FR-017): per-seller breakdown when cart spans >1 seller.
   * Present when backend returns the multi-seller split feature.
   */
  sellers?: PerSellerQuote[];
  /** Legacy alias kept for back-compat during transition. */
  per_seller?: PerSellerQuote[];
}

// ── Support contact — for shoppers who don't know how to pay ───────────────────
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+212708150351';
const SUPPORT_WHATSAPP = SUPPORT_PHONE.replace(/[^0-9]/g, '');

// ── Types ─────────────────────────────────────────────────────────────────────
interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface PaymentInfo {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  // cod = cash on delivery (Morocco-only, ≤ COD_MAX); transfer = offline
  // money-transfer requiring an uploaded receipt; gateway = card/paypal (soon).
  kind: 'cod' | 'transfer' | 'gateway';
}

// COD is allowed only within Morocco and up to this order total (MAD); mirrors
// the server rule in OrderService::assertCodAllowed.
const COD_MAX_AMOUNT = 500;

// Fallback key type kept for the initial state; real IDs come from API methods.
type ShippingMethodKey = string;

// ── Constants ─────────────────────────────────────────────────────────────────
const initialShippingInfo: ShippingInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  apartment: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'MA',
};

const initialPaymentInfo: PaymentInfo = {
  cardNumber: '',
  cardHolder: '',
  expiryDate: '',
  cvv: '',
};

const countries = [
  { code: 'MA', name: 'Morocco' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
];

const getCountryName = (code: string, t: (k: string) => string) => {
  const country = countries.find((c) => c.code === code);
  return country ? t(`countries.${country.code.toLowerCase()}`) : code;
};

// ── Buy-now item type ─────────────────────────────────────────────────────────
interface BuyNowItem {
  product_id: number;
  stock_id?: number;
  variant_id?: number;
  store_id: number;
  quantity: number;
  unit_price: number;
  name: string;
  name_ar?: string;
  image: string;
  ts: number;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { state: cartState, clearCart } = useCart();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const { triggerOnCheckout } = usePWATriggers();

  // ── Buy-now guest mode ────────────────────────────────────────────────────
  // Read buyNow flag and sessionStorage item client-side (avoids Suspense
  // boundary that useSearchParams requires in Next.js 15 App Router).
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('buyNow') !== '1') return;

    try {
      const raw = sessionStorage.getItem('beldify_buy_now');
      if (!raw) return;
      const parsed: BuyNowItem = JSON.parse(raw);
      // Reject stale items (older than 30 min)
      if (Date.now() - parsed.ts > 30 * 60 * 1000) {
        sessionStorage.removeItem('beldify_buy_now');
        return;
      }
      setIsBuyNow(true);
      setBuyNowItem(parsed);
    } catch {
      // Malformed JSON — ignore, fall through to regular cart path
    }
  }, []);

  // Locale-aware currency formatter — shared with order-confirmation so the same
  // cart renders identical digits/grouping across both screens (Arabic numerals).
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(i18n.language, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const [step, setStep] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<string>('cod');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>(initialShippingInfo);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>(initialPaymentInfo);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addressMode, setAddressMode] = useState<'manual' | 'location'>('manual');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [sendUpdates, setSendUpdates] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodKey>('standard');

  // ── Dynamic shipping methods (Task 1) ────────────────────────────────────
  const [dynamicShippingMethods, setDynamicShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingMethodsLoading, setShippingMethodsLoading] = useState(false);

  // ── Saved addresses (Task 2 — auth only) ─────────────────────────────────
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  // ── Quote state (buyNow path only) ───────────────────────────────────────
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  // Collapsible optional fields (apartment, postal code)
  const [showExtraFields, setShowExtraFields] = useState(false);

  // Trigger PWA prompt on checkout page
  useEffect(() => {
    triggerOnCheckout();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill from authenticated profile
  useEffect(() => {
    if (isAuthenticated && user) {
      let firstName = '';
      let lastName = '';

      if (user?.first_name || user?.last_name) {
        firstName = user?.first_name || '';
        lastName = user?.last_name || '';
      } else if (user?.full_name_en) {
        const nameParts = user.full_name_en.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      } else if (user?.username) {
        firstName = user.username;
      }

      setShippingInfo((prev) => ({
        ...prev,
        firstName: firstName || prev.firstName,
        lastName: lastName || prev.lastName,
        email: user.email || prev.email,
        phone: user.contact_number || prev.phone,
        address: user.address_en || prev.address,
      }));
    }
  }, [isAuthenticated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers (verbatim from original) ──────────────────────────────────────
  const handleShippingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const getPaymentMethods = (): PaymentMethod[] => {
    // Phase 1 guest "Buy Now" is COD-only.  The submit path already hardcodes
    // payment_method: 'cod'; hiding all other methods prevents a confusing UX
    // where a guest selects "Bank transfer" but the order is always placed as COD.
    const allMethods: PaymentMethod[] = [
    {
      id: 'cod',
      kind: 'cod',
      name: t('checkout.payment.methods.cod.title', 'Cash on delivery'),
      icon: '/icons/cod.svg',
      description: t('checkout.payment.methods.cod.description', 'Pay in cash when your order arrives'),
    },
    {
      id: 'bank_transfer',
      kind: 'transfer',
      name: t('checkout.payment.methods.bank_transfer.title', 'Bank transfer'),
      icon: '/icons/cod.svg',
      description: t('checkout.payment.methods.bank_transfer.description', 'Transfer to our bank account, then upload the receipt'),
    },
    {
      id: 'wafacash',
      kind: 'transfer',
      name: t('checkout.payment.methods.wafacash.title', 'Wafacash'),
      icon: '/icons/cod.svg',
      description: t('checkout.payment.methods.wafacash.description', 'Pay via Wafacash, then upload the receipt'),
    },
    {
      id: 'cash_plus',
      kind: 'transfer',
      name: t('checkout.payment.methods.cash_plus.title', 'Cash Plus'),
      icon: '/icons/cod.svg',
      description: t('checkout.payment.methods.cash_plus.description', 'Pay via Cash Plus, then upload the receipt'),
    },
    {
      id: 'western_union',
      kind: 'transfer',
      name: t('checkout.payment.methods.western_union.title', 'Western Union'),
      icon: '/icons/cod.svg',
      description: t('checkout.payment.methods.western_union.description', 'Send via Western Union, then upload the receipt'),
    },
    {
      id: 'moneygram',
      kind: 'transfer',
      name: t('checkout.payment.methods.moneygram.title', 'MoneyGram'),
      icon: '/icons/cod.svg',
      description: t('checkout.payment.methods.moneygram.description', 'Send via MoneyGram, then upload the receipt'),
    },
    {
      id: 'paypal',
      kind: 'gateway',
      name: t('checkout.payment.methods.paypal.title', 'PayPal'),
      icon: '/icons/paypal.svg',
      description: t('checkout.payment.methods.paypal.description', 'Pay securely via PayPal'),
    },
    {
      id: 'card',
      kind: 'gateway',
      name: t('checkout.payment.methods.card.title', 'Credit / Debit Card'),
      icon: '/icons/visa.svg',
      description: t('checkout.payment.methods.card.description', 'Pay with Visa, Mastercard, or similar'),
    },
  ];
    return allMethods;
  };

  // COD eligibility — for buyNow we trust the backend quote; for cart we mirror
  // the backend rule client-side (Morocco only, ≤ COD_MAX_AMOUNT).
  const effectiveTotalForCod = isBuyNow
    ? (buyNowItem ? buyNowItem.unit_price * buyNowItem.quantity : 0)
    : (cartState?.total_amount ?? 0);
  const codAllowed = isBuyNow
    ? (quote ? quote.cod_allowed : (
        effectiveTotalForCod <= COD_MAX_AMOUNT &&
        (shippingInfo.country || '').toUpperCase() === 'MA'
      ))
    : (
        effectiveTotalForCod <= COD_MAX_AMOUNT &&
        (shippingInfo.country || '').toUpperCase() === 'MA'
      );

  // Reason a method can't be picked (null = selectable).
  const paymentDisabledReason = (method: PaymentMethod): string | null => {
    // Online gateways (card / PayPal) are bypassed — no real charge is taken.
    // The order is created with payment_status 'pending' for manual confirmation.
    if (method.kind === 'cod' && !codAllowed) {
      return effectiveTotalForCod > COD_MAX_AMOUNT
        ? t('checkout.payment.cod_over_limit', `Not available over ${COD_MAX_AMOUNT} MAD`)
        : t('checkout.payment.cod_morocco_only', 'Only available inside Morocco');
    }
    return null;
  };

  const handleLocationDetection = () => {
    setIsLoadingLocation(true);
    if (!navigator.geolocation) {
      toast.error(t('checkout.shipping.errors.location_not_supported'));
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.address;

          let detectedCountry = address.country || '';
          const countryMap: Record<string, string> = {
            Morocco: 'MA',
            'Saudi Arabia': 'SA',
            'United Arab Emirates': 'AE',
            Qatar: 'QA',
            Kuwait: 'KW',
            Bahrain: 'BH',
            Oman: 'OM',
          };
          if (countryMap[detectedCountry]) detectedCountry = countryMap[detectedCountry];

          setShippingInfo((prev) => ({
            ...prev,
            address: address.road || address.street || '',
            city: address.city || address.town || '',
            state: address.state || '',
            country: detectedCountry,
            postalCode: address.postcode || '',
            latitude,
            longitude,
          }));

          setAddressMode('location');
          toast.success(t('checkout.shipping.success.location_detected'));
        } catch (error) {
          logger.error('Error fetching address:', error);
          toast.error(t('checkout.shipping.errors.address_failed'));
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        logger.error('Geolocation error:', error);
        toast.error(t('checkout.shipping.errors.location_failed'));
        setIsLoadingLocation(false);
      }
    );
  };

  const validateShippingInfo = () => {
    const requiredFields = {
      email: 'email',
      phone: 'phone',
      address: 'address',
      city: 'city',
      state: 'state',
      country: 'country',
    };

    const missingFields: string[] = [];
    for (const [field, translationKey] of Object.entries(requiredFields)) {
      if (!shippingInfo[field as keyof ShippingInfo]) {
        missingFields.push(t(`checkout.shipping.form.${translationKey}`));
      }
    }

    if (missingFields.length > 0) {
      logger.log(`Missing shipping fields: ${missingFields.join(', ')}`);
      toast.error(
        `${t('checkout.errors.shipping_info_incomplete')}: ${missingFields.join(', ')}`
      );
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingInfo.email)) {
      logger.log(`Invalid email format: ${shippingInfo.email}`);
      toast.error(t('checkout.errors.invalid_email'));
      return false;
    }

    const phoneRegex = /^\+?[0-9\s\-\(\)]{8,20}$/;
    if (!phoneRegex.test(shippingInfo.phone)) {
      logger.log(`Invalid phone format: ${shippingInfo.phone}`);
      toast.error(t('checkout.errors.invalid_phone'));
      return false;
    }

    return true;
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateShippingInfo()) return;
    setStep(2);
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return t('checkout.validation.email_required');
        if (!emailRegex.test(value)) return t('checkout.validation.email_invalid');
        return '';
      }
      case 'phone': {
        const phoneRegex = /^\+?[0-9\s\-\(\)]{8,20}$/;
        if (!value) return t('checkout.validation.phone_required');
        if (!phoneRegex.test(value.replace(/\s/g, '')))
          return t('checkout.validation.phone_invalid');
        return '';
      }
      case 'address':
        if (!value.trim()) return t('checkout.validation.address_required');
        if (value.trim().length < 5) return t('checkout.validation.address_short');
        return '';
      case 'city':
        if (!value.trim()) return t('checkout.validation.city_required');
        return '';
      case 'state':
        if (!value.trim()) return t('checkout.validation.state_required');
        return '';
      case 'country':
        if (!value) return t('checkout.validation.country_required');
        return '';
      default:
        return '';
    }
  };

  const handleFieldBlur = (fieldName: string, value: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, value);
    setValidationErrors((prev) => ({ ...prev, [fieldName]: error }));
  };

  const handlePaymentSubmit = async () => {
    try {
      setIsProcessing(true);

      // Guest cart checkout is allowed — no auth wall here.
      // Guests may complete COD / transfer orders without an account.
      // The backend POST /api/orders/checkout accepts guest payloads (auth optional).
      // Saved-addresses UI remains auth-only (handled separately via isAuthenticated guards).

      // Server-cart stock loop — skip for buy-now (no server cart involved)
      if (!isBuyNow) for (const item of cartState!.items) {
        try {
          const stockAvailable = await cartService.checkStock(item.stock_id);

          logger.log(
            `Stock check for item ${item.product.name} (stock_id: ${item.stock_id}):`,
            {
              available_quantity: stockAvailable.available_quantity,
              requested_quantity: item.quantity,
              status: stockAvailable.status,
            }
          );

          if (
            ['out_of_stock', 'no_stock', 'variant_not_found'].includes(
              stockAvailable.status
            ) ||
            !stockAvailable.available_quantity ||
            stockAvailable.available_quantity === 0
          ) {
            throw new Error(
              t('checkout.errors.item_unavailable', { name: item.product.name })
            );
          }

          if (stockAvailable.available_quantity < item.quantity) {
            throw new Error(
              t('checkout.errors.insufficient_stock', {
                count: stockAvailable.available_quantity,
                name: item.product.name,
              })
            );
          }

          if (stockAvailable.status === 'low_stock') {
            logger.warn(
              `Low stock warning: ${stockAvailable.available_quantity} items remaining for ${item.product.name}`
            );
          }
        } catch (error: any) {
          logger.error('Stock validation error:', {
            error,
            item: item.product.name,
            stockId: item.stock_id,
            quantity: item.quantity,
          });
          toast.error(
            error.message || 'An error occurred while checking stock availability.'
          );
          return;
        }
      }

      const paymentMethodMap: Record<string, string> = {
        card: 'credit_card',
        paypal: 'paypal',
        cod: 'cash_on_delivery',
        // Offline transfers are already canonical — pass through unchanged.
        bank_transfer: 'bank_transfer',
        wafacash: 'wafacash',
        cash_plus: 'cash_plus',
        western_union: 'western_union',
        moneygram: 'moneygram',
      };
      const normalizedPaymentMethod = paymentMethodMap[selectedPayment] || selectedPayment;

      if (
        !shippingInfo ||
        !shippingInfo.address ||
        !shippingInfo.city ||
        !shippingInfo.country
      ) {
        toast.error(t('checkout.errors.shipping_info_required'));
        return;
      }

      if (!shippingInfo.firstName || shippingInfo.firstName.trim().length < 2) {
        toast.error(t('checkout.validation.first_name_required'));
        return;
      }

      if (!shippingInfo.lastName || shippingInfo.lastName.trim().length < 2) {
        toast.error(t('checkout.validation.last_name_required'));
        return;
      }

      const phoneDigits = shippingInfo.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        toast.error(t('checkout.validation.phone_min_digits'));
        return;
      }

      const availablePaymentMethods = [
        'cash_on_delivery',
        'bank_transfer',
        'wafacash',
        'cash_plus',
        'western_union',
        'moneygram',
        // Bypassed online gateways — accepted; order is created without a real
        // charge (backend sets payment_status 'pending' for these).
        'credit_card',
        'paypal',
      ];
      if (!availablePaymentMethods.includes(normalizedPaymentMethod)) {
        toast.error(t('checkout.validation.payment_method_invalid'));
        return;
      }

      let normalizedCountry = (shippingInfo.country || '').trim();
      const countryMap: Record<string, string> = {
        'United States': 'US',
        'United States of America': 'US',
        USA: 'US',
        Canada: 'CA',
        'United Kingdom': 'GB',
        UK: 'GB',
        'Great Britain': 'GB',
        England: 'GB',
        Australia: 'AU',
        Germany: 'DE',
        France: 'FR',
        Italy: 'IT',
        Spain: 'ES',
        Netherlands: 'NL',
        Belgium: 'BE',
        Sweden: 'SE',
        Norway: 'NO',
        Denmark: 'DK',
        Finland: 'FI',
        Switzerland: 'CH',
        Austria: 'AT',
        Japan: 'JP',
        China: 'CN',
        India: 'IN',
        Brazil: 'BR',
        Mexico: 'MX',
        'South Korea': 'KR',
        Singapore: 'SG',
        'New Zealand': 'NZ',
        Morocco: 'MA',
        'Saudi Arabia': 'SA',
        'United Arab Emirates': 'AE',
        Qatar: 'QA',
        Kuwait: 'KW',
        Bahrain: 'BH',
        Oman: 'OM',
      };
      if (countryMap[normalizedCountry]) normalizedCountry = countryMap[normalizedCountry];

      // ── Common shipping info shape ──────────────────────────────────────────
      const shippingPayload = {
        first_name: (shippingInfo.firstName || '').trim(),
        last_name: (shippingInfo.lastName || '').trim(),
        email: (shippingInfo.email || '').trim().toLowerCase(),
        phone: (shippingInfo.phone?.replace(/\D/g, '') || '').trim(),
        address: (shippingInfo.address || '').trim(),
        apartment: (shippingInfo.apartment || '').trim(),
        city: (shippingInfo.city || '').trim(),
        state: (shippingInfo.state || '').trim(),
        zip_code: (shippingInfo.postalCode || '').trim(),
        country: normalizedCountry,
      };

      let response: any;

      if (isBuyNow && buyNowItem) {
        // ── Guest path — POST /api/orders/checkout ──────────────────────────
        // Use quote numbers (authoritative) when available; guard against no-quote
        if (!quote && !quoteLoading) {
          toast.error(t('checkout.quote.load_error', 'Could not calculate order total. Please try again.'));
          return;
        }

        const buyNowSubtotalFinal = quote ? quote.subtotal : buyNowItem.unit_price * buyNowItem.quantity;
        const buyNowShippingFinal = quote ? quote.shipping_amount : 0;
        const buyNowTaxFinal = quote ? quote.tax_amount : 0;
        const buyNowDiscountFinal = quote ? quote.discount_amount : 0;
        const buyNowTotalFinal = quote ? quote.total_amount : buyNowSubtotalFinal;

        const checkoutPayload = {
          items: [
            {
              product_id: buyNowItem.product_id,
              quantity: buyNowItem.quantity,
              unit_price: buyNowItem.unit_price,
              ...(buyNowItem.stock_id ? { stock_id: buyNowItem.stock_id } : {}),
              ...(buyNowItem.variant_id ? { variant_id: buyNowItem.variant_id } : {}),
              store_id: buyNowItem.store_id ?? 0,
            },
          ],
          shipping_info: shippingPayload,
          payment_method: normalizedPaymentMethod,
          subtotal: buyNowSubtotalFinal,
          tax_amount: buyNowTaxFinal,
          shipping_amount: buyNowShippingFinal,
          discount_amount: buyNowDiscountFinal,
          total_amount: buyNowTotalFinal,
          coupon_code: null,
          marketing_opt_in: sendUpdates,
        };

        response = await (orderService as any).createCheckoutOrder(checkoutPayload);
      } else if (isAuthenticated && user?.id) {
        // ── Authenticated cart path — POST /api/orders ──────────────────────
        const orderData = {
          items: cartState!.items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: String(item.unit_price),
            ...(item.stock_id && { stock_id: item.stock_id }),
            ...(item.variant_id && { variant_id: item.variant_id }),
            store_id: item.store?.id || 0,
          })),
          shipping_info: shippingPayload,
          payment_method: normalizedPaymentMethod,
          // Additive — backend ignores if not yet supported
          shipping_method_id: shippingMethod,
          status: 'pending',
          subtotal: String(cartState!.subtotal),
          tax_amount: String(cartState!.tax_amount),
          shipping_amount: String(cartState!.shipping_amount),
          discount_amount: String(cartState!.discount_amount),
          total_amount: String(cartState!.total_amount),
          coupon_code: cartState!.coupon_code || null,
          marketing_opt_in: sendUpdates,
        };
        response = await orderService.createOrder(orderData);
      } else {
        // ── Guest cart path — POST /api/orders/checkout (auth optional) ────
        // Guest has no account but can still check out via COD / transfer.
        // Uses the same public endpoint as the buy-now flow.
        const guestCartPayload = {
          items: cartState!.items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: typeof item.unit_price === 'string'
              ? parseFloat(item.unit_price)
              : item.unit_price,
            ...(item.stock_id ? { stock_id: item.stock_id } : {}),
            ...(item.variant_id ? { variant_id: item.variant_id } : {}),
            store_id: item.store?.id ?? 0,
          })),
          shipping_info: shippingPayload,
          payment_method: normalizedPaymentMethod,
          subtotal: cartState!.subtotal ?? 0,
          tax_amount: cartState!.tax_amount ?? 0,
          shipping_amount: cartState!.shipping_amount ?? 0,
          discount_amount: cartState!.discount_amount ?? 0,
          total_amount: cartState!.total_amount ?? 0,
          coupon_code: cartState!.coupon_code ?? null,
          marketing_opt_in: sendUpdates,
        };
        response = await (orderService as any).createCheckoutOrder(guestCartPayload);
      }

      // ── Task 2: Save new address (non-blocking, auth only) ──────────────
      // Only save when the user typed a fresh address (no existing address selected)
      // and checked the "save this address" box.
      if (isAuthenticated && saveNewAddress && !selectedAddressId) {
        addressService
          .create({
            first_name: shippingPayload.first_name,
            last_name: shippingPayload.last_name,
            email: shippingPayload.email,
            phone: shippingPayload.phone,
            address: shippingPayload.address,
            apartment: shippingPayload.apartment,
            city: shippingPayload.city,
            state: shippingPayload.state,
            postal_code: shippingPayload.zip_code,
            country: shippingPayload.country,
          })
          .catch((err) => {
            logger.warn('Non-blocking: failed to save address:', err);
          });
      }

      if (response.success || response.status === 'success') {
        // Extract group_number first (new multi-seller OrderGroup identifier, plan.md)
        // Fall back to order_number for single-seller / back-compat legacy clients.
        const group_number =
          response?.data?.group_number ||
          response?.data?.order_group?.group_number ||
          response?.group_number;

        const orderNumber =
          group_number ||
          response?.data?.order_number ||
          response?.data?.order?.order_number ||
          response?.order_number ||
          response?.order?.order_number ||
          response?.data?.orderNumber ||
          response?.orderNumber ||
          response?.data?.id ||
          response?.id;

        if (isBuyNow) {
          // Guest path: clear the buy-now stash and save order data for confirmation
          try { sessionStorage.removeItem('beldify_buy_now'); } catch { /* noop */ }
          // Stash enough for the confirmation page (no auth, can't fetch from server).
          // FR-018: include group_number + orders[] so confirmation can enumerate sub-orders.
          try {
            const orderData = response?.data?.order || response?.data || response?.order || {};
            // Sub-orders array from a multi-seller split checkout (plan.md)
            const subOrders: Array<{ id: number | string; order_number: string; store_id: number; store_name?: string; total_amount?: number }> =
              response?.data?.orders || response?.data?.order_group?.orders || [];
            const guestOrderStash = {
              order_number: orderNumber,
              // NEW: group reference for FR-018 confirmation page sub-order enumeration
              checkout_group_id: group_number,
              // NEW: sub-orders from split checkout (plan.md sellers[])
              orders: subOrders.length > 0 ? subOrders : undefined,
              payment_status: orderData.payment_status ||
                (normalizedPaymentMethod === 'cash_on_delivery' ? 'pending' : 'awaiting_payment'),
              payment_method: normalizedPaymentMethod,
              total_amount: totalAmount,
              shipping_amount: shippingAmount,
              tax_amount: taxAmount,
              items: [{
                id: String(buyNowItem!.product_id),
                product_name: buyNowItem!.name,
                quantity: buyNowItem!.quantity,
                unit_price: buyNowItem!.unit_price,
                product: {
                  name: buyNowItem!.name,
                  image_url: buyNowItem!.image,
                },
              }],
              shipping_info: shippingPayload,
              created_at: new Date().toISOString(),
            };
            sessionStorage.setItem('beldify_last_order', JSON.stringify(guestOrderStash));
          } catch { /* noop */ }
        } else {
          await clearCart();
        }
        toast.success(t('checkout.success.order_placed'));

        if (orderNumber) {
          router.push(
            `/order-confirmation?orderId=${encodeURIComponent(String(orderNumber))}`
          );
        } else {
          toast.success(t('checkout.success.redirecting_orders'));
          router.push('/orders');
        }
      } else {
        if (
          response.message?.includes('insufficient stock') ||
          response.message?.includes('out of stock')
        ) {
          throw new Error(
            t('checkout.errors.cart_items_unavailable')
          );
        }
        throw new Error(response.message || t('checkout.errors.order_creation_failed'));
      }
    } catch (error: any) {
      logger.error('Order processing error:', error);
      if (error.response?.status === 422) {
        const validationErrs = error.response.data.errors;
        Object.entries(validationErrs || {}).forEach(([field, messages]: [string, any]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            toast.error(`${field}: ${messages[0]}`);
          }
        });
      } else {
        toast.error(error.message || t('checkout.errors.processing_failed'));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    const method = getPaymentMethods().find((m) => m.id === methodId);
    if (method && paymentDisabledReason(method)) return; // not selectable
    setSelectedPayment(methodId);
  };

  // ── Task 2: Prefill form from selected saved address ─────────────────────
  const handleAddressSelect = (addressId: number) => {
    setSelectedAddressId(addressId);
    const addr = savedAddresses.find((a) => a.id === addressId);
    if (!addr) return;
    const prefill = addressService.prefillFromAddress(addr);
    setShippingInfo((prev) => ({
      ...prev,
      firstName: prefill.firstName || prev.firstName,
      lastName: prefill.lastName || prev.lastName,
      email: prefill.email || prev.email,
      phone: prefill.phone || prev.phone,
      address: prefill.address,
      apartment: prefill.apartment ?? prev.apartment,
      city: prefill.city,
      state: prefill.state,
      postalCode: prefill.postalCode ?? '',
      country: prefill.country,
    }));
    // Reset validation errors after prefill
    setValidationErrors({});
    setTouchedFields({});
  };

  // ── Fetch quote whenever buyNow item or delivery country changes ──────────
  // This drives authoritative totals and COD eligibility for the guest path.
  useEffect(() => {
    if (!isBuyNow || !buyNowItem) return;

    let cancelled = false;
    const fetchQuote = async () => {
      setQuoteLoading(true);
      setQuoteError(null);
      try {
        const result = await orderService.getCheckoutQuote({
          items: [{ stock_id: buyNowItem.stock_id, quantity: buyNowItem.quantity }],
          country: shippingInfo.country || 'MA',
          coupon_code: null,
        });
        if (!cancelled) setQuote(result);
      } catch {
        if (!cancelled) {
          setQuoteError(t('checkout.quote.load_error', 'Could not calculate order total. Please try again.'));
          setQuote(null);
        }
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    };

    fetchQuote();
    return () => {
      cancelled = true;
    };
  }, [isBuyNow, buyNowItem, shippingInfo.country]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Task 2: Load saved addresses for authenticated users ──────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const load = async () => {
      try {
        const addresses = await addressService.list();
        if (cancelled) return;
        setSavedAddresses(addresses);
        // Preselect the default address if one exists
        const defaultAddr = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          // Prefill form fields from the default address
          const prefill = addressService.prefillFromAddress(defaultAddr);
          setShippingInfo((prev) => ({
            ...prev,
            firstName: prefill.firstName || prev.firstName,
            lastName: prefill.lastName || prev.lastName,
            email: prefill.email || prev.email,
            phone: prefill.phone || prev.phone,
            address: prefill.address || prev.address,
            apartment: prefill.apartment ?? prev.apartment,
            city: prefill.city || prev.city,
            state: prefill.state || prev.state,
            postalCode: prefill.postalCode ?? prev.postalCode,
            country: prefill.country || prev.country,
          }));
        }
      } catch {
        // Non-blocking — address book failure must not break checkout
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // If COD becomes ineligible (cart > limit or shipping leaves Morocco) while it
  // is the selected method, fall back to the first transfer option.
  // W2-FE-1: fire a non-blocking informational toast so the buyer understands
  // why the payment method changed (never silent).
  useEffect(() => {
    if (selectedPayment === 'cod' && !codAllowed) {
      setSelectedPayment('bank_transfer');
      // Only toast when the total is the disqualifying reason (not country)
      if (effectiveTotalForCod > COD_MAX_AMOUNT) {
        toast.info(
          t(
            'checkout.payment.cod_switched_toast',
            'Payment switched to bank transfer (order exceeds 500 MAD)'
          )
        );
      }
    }
  }, [selectedPayment, codAllowed]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived totals — branch on isBuyNow ─────────────────────────────────
  // For the buyNow path, use quote numbers once available; fall back to item
  // math only while the quote is still loading (avoids a flash of wrong total).
  const buyNowSubtotalDerived = buyNowItem ? buyNowItem.unit_price * buyNowItem.quantity : 0;
  const subtotal = isBuyNow
    ? (quote ? quote.subtotal : buyNowSubtotalDerived)
    : (cartState?.subtotal ?? 0);
  const shippingAmount = isBuyNow
    ? (quote ? quote.shipping_amount : 0)
    : (cartState?.shipping_amount ?? 0);
  const taxAmount = isBuyNow
    ? (quote ? quote.tax_amount : 0)
    : (cartState?.tax_amount ?? 0);
  const discountAmount = isBuyNow
    ? (quote ? quote.discount_amount : 0)
    : (cartState?.discount_amount ?? 0);
  const totalAmount = isBuyNow
    ? (quote ? quote.total_amount : buyNowSubtotalDerived)
    : (cartState?.total_amount ?? 0);

  // ── Task 1: Load dynamic shipping methods ────────────────────────────────
  // Fetch whenever subtotal changes. On failure, dynamicShippingMethods stays []
  // and renderDeliveryStep falls back to the hardcoded shippingMethodOptions below.
  // Must stay below the derived `subtotal` (TDZ) and above the empty-cart return.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setShippingMethodsLoading(true);
      try {
        const methods = await shippingService.getMethods(subtotal);
        if (!cancelled) setDynamicShippingMethods(methods);
      } catch {
        // getMethods never throws (it catches internally), but guard just in case
        if (!cancelled) setDynamicShippingMethods([]);
      } finally {
        if (!cancelled) setShippingMethodsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [subtotal]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Empty cart state ──────────────────────────────────────────────────────
  // Skip for buy-now guests — they have no server cart.
  if (!isBuyNow && !cartState?.items?.length) {
    return (
      <div className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 ring-2 ring-amber-200 mb-8 shadow-atlas-sm">
            <ShoppingBag className="w-9 h-9 text-amber-500" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-balance"
            style={playfair}
          >
            {t(
              'checkout.empty.heading',
              'Your bag is empty — nothing to ship.'
            )}
          </h2>
          <p className="text-gray-500 mb-8 max-w-sm">
            {t('checkout.empty.subtitle', 'Find something you love and come back.')}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3 px-8 text-sm font-semibold transition-all duration-200 hover-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700/50"
          >
            {t('checkout.empty.cta', 'Back to shopping')}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        <ReassuranceStrip t={t} />
        <BespokeStrip t={t} />
      </div>
    );
  }

  // ── Input helper — text-base + min-h-[48px] for non-technical users ─────
  const inputClass = (field?: string) =>
    `block w-full rounded-2xl bg-amber-50 ring-1 ${
      field && touchedFields[field] && validationErrors[field]
        ? 'ring-rose-400 focus:ring-rose-500'
        : 'ring-gray-200 focus:ring-indigo-700/40'
    } px-3 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all duration-150 min-h-[48px]`;

  // ── Payment step ─────────────────────────────────────────────────────────
  const renderPaymentSection = () => (
    <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-6 shadow-atlas-sm">
      <h2
        id="payment-title"
        className="text-xl font-semibold text-gray-900 mb-1"
        style={playfair}
      >
        {t('checkout.payment.title', 'طريقة الدفع')}
      </h2>
      {/* COD subtitle — prominent for non-technical users */}
      {codAllowed && (
        <p className="text-sm text-indigo-600 mb-3">
          {t('checkout.payment.cod_subtitle', 'خلّص ملي توصلك السلعة — الدفع عند الاستلام')}
        </p>
      )}

      {/* W2-FE-1: Non-blocking COD cap informational notice */}
      {/* Shown whenever the total exceeds COD_MAX_AMOUNT, regardless of selected method */}
      {effectiveTotalForCod > COD_MAX_AMOUNT && (
        <div
          role="note"
          aria-live="polite"
          className="mb-5 flex items-start gap-2 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 text-sm text-amber-800"
        >
          <span aria-hidden="true" className="shrink-0 mt-0.5 text-base">ℹ️</span>
          <span>
            {t(
              'checkout.payment.cod_cap_info',
              'Cash on delivery is available up to 500 MAD. For orders above that, please pay by bank transfer.'
            )}
          </span>
        </div>
      )}

      {!codAllowed && effectiveTotalForCod <= COD_MAX_AMOUNT && <div className="mb-5" />}

      <fieldset className="space-y-3" role="radiogroup" aria-labelledby="payment-title">
        <legend className="sr-only">{t('checkout.payment.title', 'Payment method')}</legend>
        {getPaymentMethods().map((method) => (
          <div
            key={method.id}
            role="radio"
            aria-checked={selectedPayment === method.id}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePaymentMethodSelect(method.id);
              }
            }}
            className={`relative flex items-center p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${
              selectedPayment === method.id
                ? 'border-indigo-700 bg-indigo-50 shadow-atlas-sm'
                : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
            }`}
            onClick={() => handlePaymentMethodSelect(method.id)}
          >
            <div className="flex items-center flex-1 gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <Image
                  src={method.icon}
                  alt=""
                  width={40}
                  height={40}
                  className="object-contain p-1"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  {t(`checkout.payment.methods.${method.id}`, method.name)}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t(`checkout.payment.descriptions.${method.id}`, method.description)}
                </p>
              </div>
            </div>
            {/* Custom radio dot */}
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedPayment === method.id ? 'border-indigo-700' : 'border-gray-300'
              }`}
            >
              {selectedPayment === method.id && (
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-700" />
              )}
            </div>
            {paymentDisabledReason(method) && (
              <div className="absolute inset-0 bg-white flex items-center justify-center rounded-2xl">
                <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-atlas-sm ring-1 ring-gray-200">
                  {paymentDisabledReason(method)}
                </span>
              </div>
            )}
          </div>
        ))}
      </fieldset>

      {/* Help for shoppers who don't know how to pay */}
      <div className="mt-6 rounded-2xl bg-gray-50 ring-1 ring-gray-200 p-4">
        <div className="flex items-start gap-3">
          <Headphones className="w-5 h-5 text-indigo-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {t('checkout.payment.need_help_title', 'Not sure how to pay?')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t(
                'checkout.payment.need_help_body',
                "Message or call us and we'll guide you through it."
              )}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 ring-1 ring-green-200 rounded-full px-3 py-1.5 hover:bg-green-100 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                {t('checkout.payment.whatsapp', 'WhatsApp')}
              </a>
              <a
                href={`tel:${SUPPORT_PHONE}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 ring-1 ring-indigo-200 rounded-full px-3 py-1.5 hover:bg-indigo-100 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                {t('checkout.payment.call', 'Call us')}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* W2-FE-2: Pre-order disclosure for bank-transfer methods */}
      {/* Shown BEFORE the place-order button so the buyer is never committed blind. */}
      {/* NOTE: getPaymentInstructions() (orderService) requires an order_id and
           therefore CANNOT be called pre-order. We surface the amount + a clear
           note that RIB details appear after placing the order.
           Finding: endpoint is /api/payment-methods/{method}/instructions — this
           returns a generic account/instructions for the method WITHOUT order context,
           so we CAN call it here to surface the RIB pre-order when available.
           However the endpoint can return null, so we display the amount + note
           regardless, and show the account only when the fetch succeeds. */}
      {(() => {
        const selectedMethod = getPaymentMethods().find((m) => m.id === selectedPayment);
        if (selectedMethod?.kind !== 'transfer') return null;
        return (
          <div
            role="note"
            aria-live="polite"
            className="mt-6 rounded-xl bg-indigo-50 ring-1 ring-indigo-200 px-4 py-4 text-sm"
          >
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                {t('checkout.payment.transfer_amount_label', 'Amount to transfer')}
              </span>
              <span className="font-extrabold text-indigo-700 tabular-nums text-base">
                {formatAmount(totalAmount)} MAD
              </span>
            </div>
            <p className="text-xs text-indigo-600 leading-relaxed">
              {t(
                'checkout.payment.transfer_preorder_note',
                'After placing your order, bank transfer details (RIB) will appear and you can upload your receipt.'
              )}
            </p>
          </div>
        );
      })()}

      <div className="mt-6 flex justify-between gap-4">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-6 py-3 ring-1 ring-amber-200 text-gray-700 font-medium rounded-full hover:bg-amber-50 transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
        >
          {t('checkout.actions.back_to_shipping', 'Back to Delivery')}
        </button>
        <button
          onClick={handlePaymentSubmit}
          disabled={isProcessing}
          className="flex-1 inline-flex flex-col items-center justify-center bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-full py-3.5 px-8 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 shadow-sm min-h-[52px]"
        >
          {isProcessing ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{t('checkout.actions.processing', 'جاري المعالجة...')}</span>
            </>
          ) : (
            <>
              <span>{t('checkout.actions.place_order', 'أكّد الطلب')}</span>
              <span className="text-xs font-medium opacity-80 tabular-nums currency-mad mt-0.5">
                {formatAmount(totalAmount)} MAD
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // ── Delivery step — shipping method options ───────────────────────────────
  // If dynamic methods loaded: use them; else fall back to hardcoded constants.
  // Each option gets an icon by matching id prefix.
  const getMethodIcon = (id: string) => {
    if (id === 'express') return <Zap className="w-5 h-5 text-indigo-700" aria-hidden="true" />;
    if (id === 'pickup') return <Store className="w-5 h-5 text-indigo-700" aria-hidden="true" />;
    return <Truck className="w-5 h-5 text-indigo-700" aria-hidden="true" />;
  };

  // Source of truth for rendered options
  const activeMethods = dynamicShippingMethods.length > 0
    ? dynamicShippingMethods
    : shippingService.getFallback(subtotal);

  const shippingMethodOptions: Array<{
    key: ShippingMethodKey;
    icon: React.ReactNode;
    name: string;
    eta: string;
    price: string;
    isFree: boolean;
  }> = activeMethods.map((m) => ({
    key: m.id,
    icon: getMethodIcon(m.id),
    name: m.name,
    eta: m.delivery_time,
    price: m.is_free
      ? t('checkout.shipping.methods.standard.free', 'Free')
      : `${formatAmount(m.cost)} MAD`,
    isFree: m.is_free,
  }));

  const renderDeliveryStep = () => (
    <form
      id="checkout-delivery"
      onSubmit={handleShippingSubmit}
      className="space-y-5"
      noValidate
    >
      {/* Contact card */}
      <section
        className="bg-white ring-1 ring-gray-200 rounded-2xl p-6 shadow-atlas-sm"
        aria-labelledby="section-contact"
      >
        <h2
          id="section-contact"
          className="text-xl font-semibold text-gray-900 mb-5"
          style={playfair}
        >
          {t('checkout.contact.title', 'Contact')}
        </h2>
        <div className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('checkout.contact.email_label', 'Email address')}
            </label>
            <div className="relative">
              <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                value={shippingInfo.email}
                onChange={handleShippingChange}
                onBlur={(e) => handleFieldBlur('email', e.target.value)}
                placeholder={t('checkout.contact.email_placeholder', 'Email address')}
                className={`block w-full rounded-full bg-amber-50 ring-1 ${
                  touchedFields.email && validationErrors.email
                    ? 'ring-rose-400 focus:ring-rose-500'
                    : 'ring-gray-200 focus:ring-indigo-700/40'
                } ps-10 pe-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all duration-150`}
                aria-invalid={touchedFields.email && !!validationErrors.email}
                aria-describedby={touchedFields.email && validationErrors.email ? 'email-error' : undefined}
              />
            </div>
            {touchedFields.email && validationErrors.email && (
              <p id="email-error" className="text-xs text-rose-600 mt-1.5" role="alert">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Updates checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={sendUpdates}
              onChange={(e) => setSendUpdates(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-700 focus:ring-indigo-700/30 bg-amber-50"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
              {t(
                'checkout.contact.updates_label',
                'Send me order updates and offers'
              )}
            </span>
          </label>
        </div>
      </section>

      {/* Delivery address card */}
      <section
        className="bg-white ring-1 ring-gray-200 rounded-2xl p-6 shadow-atlas-sm"
        aria-labelledby="section-address"
      >
        <h2
          id="section-address"
          className="text-xl font-semibold text-gray-900 mb-5"
          style={playfair}
        >
          {t('checkout.address.title', 'Delivery address')}
        </h2>

        {/* ── Task 2: Saved address dropdown (auth only) ──────────────────── */}
        {isAuthenticated && savedAddresses.length > 0 && (
          <div className="mb-5">
            <label
              htmlFor="saved-address-select"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              <BookUser className="inline w-4 h-4 me-1.5 text-indigo-600" aria-hidden="true" />
              {t('checkout.address.saved_addresses', 'Saved addresses')}
            </label>
            <div className="relative">
              <select
                id="saved-address-select"
                value={selectedAddressId ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setSelectedAddressId(null);
                  } else {
                    handleAddressSelect(Number(val));
                  }
                }}
                className={`${inputClass()} appearance-none pe-9`}
                aria-label={t('checkout.address.saved_addresses', 'Saved addresses')}
              >
                <option value="">{t('checkout.address.type_new', 'Enter a new address')}</option>
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label
                      ? `${addr.label} — `
                      : ''}{addr.first_name} {addr.last_name}, {addr.city}
                    {addr.is_default
                      ? ` (${t('checkout.address.default_badge', 'Default')})`
                      : ''}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full name — spans 2 */}
          <div className="sm:col-span-2">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {t('checkout.address.full_name', 'Full name')}
            </label>
            <div className="relative">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                value={shippingInfo.firstName}
                onChange={handleShippingChange}
                placeholder={t('checkout.address.full_name_placeholder', 'Ahmed Benali')}
                className={`${inputClass()} ps-9`}
              />
            </div>
          </div>

          {/* Phone — spans 2 */}
          <div className="sm:col-span-2">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {t('checkout.address.phone', 'Phone')}
            </label>
            <div className="relative">
              <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                type="tel"
                id="phone"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                value={shippingInfo.phone}
                onChange={handleShippingChange}
                onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                placeholder={t(
                  'checkout.address.phone_placeholder',
                  '+212 6 00 00 00 00'
                )}
                className={`${inputClass('phone')} ps-9`}
                aria-invalid={touchedFields.phone && !!validationErrors.phone}
                aria-describedby={touchedFields.phone && validationErrors.phone ? 'phone-error' : undefined}
              />
            </div>
            {touchedFields.phone && validationErrors.phone && (
              <p id="phone-error" className="text-xs text-rose-600 mt-1.5" role="alert">
                {validationErrors.phone}
              </p>
            )}
          </div>

          {/* Country */}
          <div className="sm:col-span-2">
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {t('checkout.address.country', 'Country')}
            </label>
            <select
              id="country"
              name="country"
              value={shippingInfo.country}
              onChange={handleShippingChange}
              onBlur={(e) => handleFieldBlur('country', e.target.value)}
              className={`${inputClass('country')} appearance-none`}
              aria-invalid={touchedFields.country && !!validationErrors.country}
              aria-describedby={touchedFields.country && validationErrors.country ? 'country-error' : undefined}
            >
              <option value="">{t('common.select_option', 'Select country')}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {getCountryName(c.code, t)}
                </option>
              ))}
            </select>
            {touchedFields.country && validationErrors.country && (
              <p id="country-error" className="text-xs text-rose-600 mt-1.5" role="alert">
                {validationErrors.country}
              </p>
            )}
          </div>

          {/* City */}
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {t('checkout.address.city', 'City')}
            </label>
            <input
              type="text"
              id="city"
              name="city"
              autoComplete="address-level2"
              value={shippingInfo.city}
              onChange={handleShippingChange}
              onBlur={(e) => handleFieldBlur('city', e.target.value)}
              placeholder={t('checkout.address.city_placeholder', 'Casablanca')}
              className={inputClass('city')}
              aria-invalid={touchedFields.city && !!validationErrors.city}
              aria-describedby={touchedFields.city && validationErrors.city ? 'city-error' : undefined}
            />
            {touchedFields.city && validationErrors.city && (
              <p id="city-error" className="text-xs text-rose-600 mt-1.5" role="alert">
                {validationErrors.city}
              </p>
            )}
          </div>

          {/* State */}
          <div>
            <label
              htmlFor="state"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {t('checkout.address.state', 'Region / State')}
            </label>
            <input
              type="text"
              id="state"
              name="state"
              autoComplete="address-level1"
              value={shippingInfo.state}
              onChange={handleShippingChange}
              onBlur={(e) => handleFieldBlur('state', e.target.value)}
              placeholder={t('checkout.address.state_placeholder', 'Grand Casablanca')}
              className={inputClass('state')}
              aria-invalid={touchedFields.state && !!validationErrors.state}
              aria-describedby={touchedFields.state && validationErrors.state ? 'state-error' : undefined}
            />
            {touchedFields.state && validationErrors.state && (
              <p id="state-error" className="text-xs text-rose-600 mt-1.5" role="alert">
                {validationErrors.state}
              </p>
            )}
          </div>

          {/* Address line — spans 2 */}
          <div className="sm:col-span-2">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {t('checkout.address.address', 'Street address')}
            </label>
            <div className="relative">
              <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                id="address"
                name="address"
                autoComplete="street-address"
                value={shippingInfo.address}
                onChange={handleShippingChange}
                onBlur={(e) => handleFieldBlur('address', e.target.value)}
                placeholder={t(
                  'checkout.address.address_placeholder',
                  '123 Rue Mohammed V'
                )}
                className={`${inputClass('address')} ps-9`}
                aria-invalid={touchedFields.address && !!validationErrors.address}
                aria-describedby={touchedFields.address && validationErrors.address ? 'address-error' : undefined}
              />
            </div>
            {touchedFields.address && validationErrors.address && (
              <p id="address-error" className="text-xs text-rose-600 mt-1.5" role="alert">
                {validationErrors.address}
              </p>
            )}
          </div>

        </div>

        {/* "زيد تفاصيل أخرى" — collapses postal code + apartment */}
        <button
          type="button"
          onClick={() => setShowExtraFields((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
          aria-expanded={showExtraFields}
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-200 ${showExtraFields ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
          {t('checkout.address.extra_fields_toggle', 'زيد تفاصيل أخرى (الشقة، الكود البريدي)')}
        </button>

        {showExtraFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* Postal code */}
            <div>
              <label
                htmlFor="postalCode"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('checkout.address.postal_code', 'الكود البريدي')}
              </label>
              <div className="relative">
                <Hash className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  autoComplete="postal-code"
                  value={shippingInfo.postalCode}
                  onChange={handleShippingChange}
                  placeholder="20000"
                  className={`${inputClass()} ps-9`}
                />
              </div>
            </div>

            {/* Apartment */}
            <div>
              <label
                htmlFor="apartment"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('checkout.address.apartment', 'الشقة أو الطابق')}{' '}
                <span className="text-gray-400 font-normal text-xs">
                  ({t('common.optional', 'اختياري')})
                </span>
              </label>
              <input
                type="text"
                id="apartment"
                name="apartment"
                autoComplete="address-line2"
                value={shippingInfo.apartment}
                onChange={handleShippingChange}
                placeholder={t('checkout.address.apartment_placeholder', 'شقة 4ب')}
                className={inputClass()}
              />
            </div>
          </div>
        )}

        {/* ── Task 2: Save this address checkbox (auth only, fresh address) ── */}
        {isAuthenticated && !selectedAddressId && (
          <label className="flex items-center gap-3 cursor-pointer select-none group mt-4">
            <input
              type="checkbox"
              checked={saveNewAddress}
              onChange={(e) => setSaveNewAddress(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-700 focus:ring-indigo-700/30 bg-amber-50"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
              {t('checkout.address.save_for_next', 'Save this address for future orders')}
            </span>
          </label>
        )}
      </section>

      {/* Shipping method card */}
      <section
        className="bg-white ring-1 ring-gray-200 rounded-2xl p-6 shadow-atlas-sm"
        aria-labelledby="section-shipping"
      >
        <h2
          id="section-shipping"
          className="text-xl font-semibold text-gray-900 mb-5"
          style={playfair}
        >
          {t('checkout.shipping.title', 'Shipping method')}
        </h2>

        <fieldset role="radiogroup" aria-labelledby="section-shipping">
          <legend className="sr-only">{t('checkout.shipping.title', 'Shipping method')}</legend>
          <div className="space-y-3">
            {shippingMethodOptions.map((opt) => {
              const isSelected = shippingMethod === opt.key;
              return (
                <label
                  key={opt.key}
                  className={`flex items-center gap-3 p-4 rounded-2xl ring-1 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-indigo-700 bg-indigo-50 shadow-atlas-sm'
                      : 'ring-gray-200 hover:bg-gray-50 hover:ring-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={opt.key}
                    checked={isSelected}
                    onChange={() => setShippingMethod(opt.key)}
                    className="sr-only"
                  />
                  {/* Custom radio */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-indigo-700' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-700" />}
                  </div>
                  <span className="flex-shrink-0">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{opt.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.eta}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold flex-shrink-0 ${
                      opt.isFree ? 'text-amber-700' : 'text-gray-900 tabular-nums currency-mad'
                    }`}
                  >
                    {opt.price}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>
    </form>
  );

  // ── Order summary (right column) ──────────────────────────────────────────
  const renderOrderSummary = () => (
    <div className="bg-white ring-1 ring-gray-200 rounded-2xl p-6 shadow-atlas-sm lg:sticky lg:top-24 self-start">
      <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-4">
        {t('checkout.summary.kicker', 'Order Summary')}
      </p>

      {/* Line items */}
      <ul className="space-y-3 mb-5" aria-label={t('checkout.summary.items_list', 'Order items')}>
        {isBuyNow && buyNowItem ? (
          // ── Guest buy-now: render single item from sessionStorage ──────────
          <li className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0 rounded-xl ring-1 ring-amber-200 overflow-hidden bg-amber-50">
              <Image
                src={getImageUrl(buyNowItem.image, '/placeholder.png')}
                alt={((i18n.language === 'ar' || i18n.language === 'ma') ? buyNowItem.name_ar : undefined) || buyNowItem.name || t('checkout.summary.product_image_alt')}
                fill
                className="object-cover"
                sizes="48px"
              />
              <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-indigo-700 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {buyNowItem.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {((i18n.language === 'ar' || i18n.language === 'ma') ? buyNowItem.name_ar : undefined) || buyNowItem.name}
              </p>
            </div>
            <span className="text-sm font-semibold text-indigo-700 flex-shrink-0 tabular-nums currency-mad">
              {formatAmount(buyNowItem.unit_price * buyNowItem.quantity)} MAD
            </span>
          </li>
        ) : (
          // ── Authenticated cart path ────────────────────────────────────────
          cartState!.items.map((item) => {
            const productName =
              (i18n.language === 'ar' || i18n.language === 'ma') ? item.product.name_ar : item.product.name;
            return (
              <li key={item.id} className="flex items-center gap-3">
                <div className="relative w-12 h-12 flex-shrink-0 rounded-xl ring-1 ring-amber-200 overflow-hidden bg-amber-50">
                  <Image
                    src={getImageUrl(item.product.image_url, '/placeholder.png')}
                    alt={productName || t('checkout.summary.product_image_alt')}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                  {/* Quantity badge */}
                  <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-indigo-700 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {productName}
                  </p>
                </div>
                <span className="text-sm font-semibold text-indigo-700 flex-shrink-0 tabular-nums currency-mad">
                  {formatAmount(item.unit_price * item.quantity)} MAD
                </span>
              </li>
            );
          })
        )}
      </ul>

      {/* Quote loading / error state (buyNow only) */}
      {isBuyNow && quoteLoading && (
        <div className="flex items-center gap-2 text-xs text-indigo-600 py-2">
          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {t('checkout.quote.loading', 'Calculating total…')}
        </div>
      )}
      {isBuyNow && quoteError && !quoteLoading && (
        <p className="text-xs text-rose-600 py-2" role="alert">{quoteError}</p>
      )}

      {/* ── Per-seller shipping breakdown (multi-seller cart) ────────────────
           When the quote returns per_seller with >1 entry, show individual
           shipping fees per store so the buyer understands the N charges.
           Falls back to the flat shipping line for single-seller carts. */}
      {(() => {
        // Resolve the sellers array from the quote (plan.md FR-017 contract).
        // `sellers` is the new canonical field; `per_seller` is kept for back-compat.
        // For the cart path we don't have a quote, so we only show per-seller
        // breakdown when the quote is available and has >1 entry.
        const perSeller = quote?.sellers ?? quote?.per_seller;
        const isMultiSeller = Array.isArray(perSeller) && perSeller.length > 1;

        // Helper: resolve store name from cart items by store_id
        const resolveStoreName = (storeId: number, sellerEntry: PerSellerQuote): string => {
          if (sellerEntry.store_name) return sellerEntry.store_name;
          // Try to find store info from cart items
          const cartItems = isBuyNow
            ? null
            : cartState?.items;
          const matchItem = cartItems?.find(
            (item) => (item.store?.id ?? 0) === storeId
          );
          const name = matchItem?.store?.name;
          return name ?? `Shop #${storeId}`;
        };

        return (
          <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('checkout.summary.subtotal', 'Subtotal')}</span>
              <span className="text-gray-900 font-medium tabular-nums currency-mad">{formatAmount(subtotal)} MAD</span>
            </div>

            {isMultiSeller ? (
              // ── Per-seller shipping rows (plan.md FR-017 sellers[] contract) ─
              (quote!.sellers ?? quote!.per_seller)!.map((seller) => (
                <div key={seller.store_id} className="flex justify-between">
                  <span className="text-gray-600">
                    {t('checkout.summary.seller_shipping', 'Shipping — {{store}}', {
                      store: resolveStoreName(seller.store_id, seller),
                    }).replace('{{store}}', resolveStoreName(seller.store_id, seller))}
                  </span>
                  {seller.shipping_amount > 0 ? (
                    <span className="text-gray-900 font-medium tabular-nums currency-mad">
                      {formatAmount(seller.shipping_amount)} MAD
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold">
                      {t('cart.summary.free', 'Free')}
                    </span>
                  )}
                </div>
              ))
            ) : (
              // ── Flat shipping row (single seller or no per_seller data) ────
              <div className="flex justify-between">
                <span className="text-gray-600">{t('checkout.summary.shipping', 'Shipping')}</span>
                {shippingAmount > 0 ? (
                  <span className="text-gray-900 font-medium tabular-nums currency-mad">
                    {formatAmount(shippingAmount)} MAD
                  </span>
                ) : subtotal >= FREE_SHIPPING_THRESHOLD ? (
                  <span className="text-amber-700 font-semibold">
                    {t('cart.summary.free', 'Free')}
                  </span>
                ) : (
                  <span className="text-gray-900 font-medium tabular-nums">—</span>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Tax + discount rows — always flat (same for single/multi seller) */}
      <div className="space-y-2 text-sm">
        {taxAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">{t('checkout.summary.tax', 'Tax')}</span>
            <span className="text-gray-900 font-medium tabular-nums currency-mad">{formatAmount(taxAmount)} MAD</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">{t('checkout.summary.discount', 'Discount')}</span>
            <span className="text-amber-700 font-medium tabular-nums currency-mad">-{formatAmount(discountAmount)} MAD</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex items-baseline justify-between mt-4 mb-6 pt-4 border-t border-gray-200">
        <span className="text-gray-700 font-medium text-sm">
          {t('checkout.summary.total', 'Total')}
        </span>
        <span
          className="text-2xl font-bold text-indigo-700 tabular-nums currency-mad"
          style={playfair}
        >
          {formatAmount(totalAmount)} MAD
        </span>
      </div>

      {/* CTA — full-width amber-500, total inside, Darija "أكّد الطلب" */}
      {step === 1 ? (
        <button
          type="submit"
          form="checkout-delivery"
          className="w-full inline-flex flex-col items-center justify-center bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-full py-3.5 text-base font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 shadow-sm min-h-[52px]"
        >
          <span>{t('checkout.actions.continue_to_confirm', 'كمّل للتأكيد')}</span>
          <span className="text-xs font-medium opacity-80 tabular-nums currency-mad mt-0.5">
            {formatAmount(totalAmount)} MAD
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePaymentSubmit}
          disabled={isProcessing}
          className="w-full inline-flex flex-col items-center justify-center bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-full py-3.5 text-base font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 shadow-sm min-h-[52px]"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{t('checkout.actions.processing', 'جاري المعالجة...')}</span>
            </>
          ) : (
            <>
              <span>{t('checkout.actions.confirm_order', 'أكّد الطلب')}</span>
              <span className="text-xs font-medium opacity-80 tabular-nums currency-mad mt-0.5">
                {formatAmount(totalAmount)} MAD
              </span>
            </>
          )}
        </button>
      )}

      {/* Trust micro-pills */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-amber-50 ring-1 ring-amber-200 rounded-full px-3 py-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
          {t('cart.trust.secure', 'Secure payments')}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-amber-50 ring-1 ring-amber-200 rounded-full px-3 py-1.5">
          <RotateCcw className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
          {t('cart.trust.returns', 'Free 14-day returns')}
        </span>
      </div>

      <p className="text-center text-xs text-gray-400 mt-3">
        {t(
          'cart.payment_methods',
          'We accept Visa · Mastercard · Cash on Delivery'
        )}
      </p>
    </div>
  );

  // ── Progress stepper steps ─────────────────────────────────────────────────
  const steps: Array<{ id: number; label: string; completed: boolean; active: boolean }> = [
    {
      id: 1,
      label: t('checkout.stepper.bag', 'Bag'),
      completed: true,
      active: false,
    },
    {
      id: 2,
      label: t('checkout.stepper.delivery', 'Delivery'),
      completed: step > 1,
      active: step === 1,
    },
    {
      id: 3,
      label: t('checkout.stepper.payment', 'Payment'),
      completed: false,
      active: step === 2,
    },
    {
      id: 4,
      label: t('checkout.stepper.confirm', 'Confirm'),
      completed: false,
      active: false,
    },
  ];

  // Map 2-step checkout state to 3-step progress bar
  // step 1 = المعلومات, step 2 = التأكيد (payment), bag always complete
  const progressStep = step === 1 ? 2 : 3;

  return (
    <div className={`min-h-screen bg-canvas ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* ── 3-step progress bar (السلة ← المعلومات ← التأكيد) ──────────────── */}
      <div className="bg-white border-b border-gray-100 py-2">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
          <CheckoutProgressBar currentStep={progressStep as 1 | 2 | 3} />

          {/* Guest login hint — demoted, never blocking */}
          {!isAuthenticated && (
            <Link
              href={`/login?redirect=${encodeURIComponent('/checkout')}`}
              className="hidden sm:inline-flex shrink-0 text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 rounded"
            >
              {t('checkout.guest.have_account', 'عندك حساب؟ دخل')}
            </Link>
          )}
        </div>
      </div>

      {/* ── Page heading ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-2">
        <h1
          className="text-3xl sm:text-4xl font-bold text-gray-900 text-balance"
          style={playfair}
        >
          {step === 1
            ? t('checkout.heading.title', 'Where should we send it?')
            : t('checkout.heading.title_payment', 'How would you like to pay?')}
        </h1>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left col — spans 2 */}
          <div className="lg:col-span-2">
            {step === 1 ? renderDeliveryStep() : renderPaymentSection()}
          </div>

          {/* Right col — sticky summary */}
          <div className="lg:col-span-1">{renderOrderSummary()}</div>
        </div>
      </main>

      {/* ── Reassurance strip ─────────────────────────────────────────────── */}
      <ReassuranceStrip t={t} />

      {/* ── Bespoke strip ─────────────────────────────────────────────────── */}
      <BespokeStrip t={t} />
    </div>
  );
}

// ── Reassurance strip ─────────────────────────────────────────────────────────
function ReassuranceStrip({ t }: { t: (k: string, fb: string) => string }) {
  const items = [
    {
      icon: <BadgeCheck className="w-7 h-7 text-amber-500" aria-hidden="true" />,
      label: t('checkout.reassurance.verified', 'Verified Sellers'),
    },
    {
      icon: <ShieldCheck className="w-7 h-7 text-amber-500" aria-hidden="true" />,
      label: t('checkout.reassurance.authentic', 'Authentic Craft'),
    },
    {
      icon: <RotateCcw className="w-7 h-7 text-amber-500" aria-hidden="true" />,
      label: t('checkout.reassurance.returns', 'Free Returns'),
    },
    {
      icon: <Headphones className="w-7 h-7 text-amber-500" aria-hidden="true" />,
      label: t('checkout.reassurance.support', 'Multilingual Support'),
    },
  ];

  return (
    <section className="bg-gray-50 border-y border-gray-200 py-12 px-6" aria-label={t('checkout.reassurance.section_label', 'Why shop with us')}>
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

// ── Bespoke strip ─────────────────────────────────────────────────────────────
function BespokeStrip({ t }: { t: (k: string, fb: string) => string }) {
  return (
    <section className="bg-indigo-950 py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, hsl(var(--amber-500)) 0, transparent 45%), radial-gradient(circle at 80% 60%, hsl(var(--indigo-500)) 0, transparent 50%)',
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
          href="/services/tailoring"
          className="inline-flex items-center justify-center px-8 py-3 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold rounded-full transition-all duration-200 hover-lift text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400/60"
        >
          {t('checkout.bespoke.cta', 'Explore bespoke')}
          <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
