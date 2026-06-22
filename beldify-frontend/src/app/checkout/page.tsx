'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cartService } from '@/services/api';
import { useCart } from '@/contexts/CartContext';
import toast from '@/utils/toast';
import { orderService } from '@/services/orderService';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import logger from '@/utils/consoleLogger';
import { usePWATriggers } from '@/hooks/usePWATriggers';
import { getImageUrl } from '@/utils/imageUtils';
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
} from 'lucide-react';

// ── Playfair inline style token ───────────────────────────────────────────────
const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

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
}

type ShippingMethodKey = 'standard' | 'express' | 'pickup';

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

// ── Main component ────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { state: cartState, clearCart } = useCart();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const isRTL = i18n.language === 'ar';
  const { triggerOnCheckout } = usePWATriggers();

  const [step, setStep] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<string>('cod');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>(initialShippingInfo);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>(initialPaymentInfo);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addressMode, setAddressMode] = useState<'manual' | 'location'>('manual');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [sendUpdates, setSendUpdates] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodKey>('standard');

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

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

  const getPaymentMethods = (): PaymentMethod[] => [
    {
      id: 'cod',
      name: t('checkout.payment.methods.cod.title'),
      icon: '/icons/cod.svg',
      description: t('checkout.payment.methods.cod.description'),
    },
    {
      id: 'paypal',
      name: t('checkout.payment.methods.paypal.title'),
      icon: '/icons/paypal.svg',
      description: t('checkout.payment.methods.paypal.description'),
    },
    {
      id: 'card',
      name: t('checkout.payment.methods.card.title'),
      icon: '/icons/visa.svg',
      description: t('checkout.payment.methods.card.description'),
    },
  ];

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

      if (!user?.id) {
        toast.error(t('checkout.errors.auth_required'));
        return;
      }

      for (const item of cartState.items) {
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
              t('checkout.errors.item_out_of_stock', 'Item unavailable: {{name}} is out of stock or the requested quantity is not available.', { name: item.product.name })
            );
          }

          if (stockAvailable.available_quantity < item.quantity) {
            throw new Error(
              t('checkout.errors.limited_stock', 'Only {{count}} item available for {{name}}. Please update your cart.', { count: stockAvailable.available_quantity, name: item.product.name })
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
          toast.error(t('checkout.errors.stock_check_failed', 'An error occurred while checking stock availability.'));
          return;
        }
      }

      const paymentMethodMap: Record<string, string> = {
        card: 'credit_card',
        paypal: 'paypal',
        cod: 'cash_on_delivery',
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
        toast.error(t('checkout.errors.full_name_required', 'Full name is required (at least 2 characters)'));
        return;
      }

      const phoneDigits = shippingInfo.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        toast.error(t('checkout.errors.invalid_phone', 'Please enter a valid phone number'));
        return;
      }

      const availablePaymentMethods = ['credit_card', 'paypal', 'cash_on_delivery'];
      if (!availablePaymentMethods.includes(normalizedPaymentMethod)) {
        toast.error(t('checkout.errors.invalid_payment_method', 'Please select a valid payment method'));
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

      const fullNameParts = (shippingInfo.firstName || '').trim().split(/\s+/);
      const derivedFirstName = fullNameParts[0] || (shippingInfo.firstName || '').trim();
      const derivedLastName = fullNameParts.length > 1
        ? fullNameParts.slice(1).join(' ')
        : (shippingInfo.lastName || '').trim() || derivedFirstName;

      const orderData = {
        items: cartState.items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: String(item.unit_price),
          ...(item.stock_id && { stock_id: item.stock_id }),
          ...(item.variant_id && { variant_id: item.variant_id }),
          store_id: item.store?.id || 0,
        })),
        shipping_info: {
          first_name: derivedFirstName,
          last_name: derivedLastName,
          email: (shippingInfo.email || '').trim().toLowerCase(),
          phone: (shippingInfo.phone?.replace(/\D/g, '') || '').trim(),
          address: (shippingInfo.address || '').trim(),
          apartment: (shippingInfo.apartment || '').trim(),
          city: (shippingInfo.city || '').trim(),
          state: (shippingInfo.state || '').trim(),
          zip_code: (shippingInfo.postalCode || '').trim(),
          country: normalizedCountry,
        },
        payment_method: normalizedPaymentMethod,
        status: 'pending',
        subtotal: String(cartState.subtotal),
        tax_amount: String(cartState.tax_amount),
        shipping_amount: String(cartState.shipping_amount),
        discount_amount: String(cartState.discount_amount),
        total_amount: String(cartState.total_amount),
        coupon_code: cartState.coupon_code || null,
      };

      const response = await orderService.createOrder(orderData);

      if (response.success || response.status === 'success') {
        const orderNumber =
          response?.data?.order_number ||
          response?.data?.order?.order_number ||
          response?.order_number ||
          response?.order?.order_number ||
          response?.data?.orderNumber ||
          response?.orderNumber ||
          response?.data?.id ||
          response?.id;

        await clearCart();
        toast.success(t('checkout.success.order_placed'));

        if (orderNumber) {
          router.push(
            `/order-confirmation?orderId=${encodeURIComponent(String(orderNumber))}`
          );
        } else {
          toast.success(t('checkout.success.order_redirecting', 'Order placed! Redirecting to your orders...'));
          router.push('/orders');
        }
      } else {
        if (
          response.message?.includes('insufficient stock') ||
          response.message?.includes('out of stock')
        ) {
          throw new Error(
            t('checkout.errors.cart_items_unavailable', 'One or more items are no longer available in the requested quantity. Please review your cart and try again.')
          );
        }
        throw new Error(response.message || 'Order creation failed');
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
        toast.error(t('checkout.errors.processing_failed'));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPayment(methodId);
  };

  // ── Derived totals ────────────────────────────────────────────────────────
  const subtotal = cartState?.subtotal ?? 0;
  const shippingAmount = cartState?.shipping_amount ?? 0;
  const taxAmount = cartState?.tax_amount ?? 0;
  const discountAmount = cartState?.discount_amount ?? 0;
  const totalAmount = cartState?.total_amount ?? 0;

  // ── Empty cart state ──────────────────────────────────────────────────────
  if (!cartState?.items?.length) {
    return (
      <div className={`min-h-screen bg-amber-50/40 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 ring-2 ring-amber-200 mb-8">
            <ShoppingBag className="w-9 h-9 text-amber-500" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
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
            className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3 px-8 text-sm font-semibold transition-colors"
          >
            {t('checkout.empty.cta', 'Back to shopping')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ReassuranceStrip t={t} />

        <BespokeStrip t={t} />
      </div>
    );
  }

  // ── Input helper ─────────────────────────────────────────────────────────
  // expect: form inputs (input/select/textarea) use rounded-2xl per DESIGN.md §4
  const inputClass = (field?: string) =>
    `block w-full rounded-2xl bg-amber-50 ring-1 ${
      field && touchedFields[field] && validationErrors[field]
        ? 'ring-red-400 focus:ring-red-500'
        : 'ring-amber-200 focus:ring-indigo-500'
    } px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition`;

  // ── Payment step (original visual, kept verbatim) ─────────────────────────
  const renderPaymentSection = () => (
    <div className="bg-white rounded-2xl ring-1 ring-amber-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2
          id="payment-title"
          className="text-xl font-semibold text-gray-900"
          style={playfair}
        >
          {t('checkout.payment.title', 'Payment method')}
        </h2>
        <div className="flex items-center text-sm text-gray-500 gap-2">
          {/* expect: completed step indicator uses indigo-700 (not green-600) per palette */}
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-700 text-white text-xs font-medium">
            ✓
          </span>
          <span>/</span>
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-700 text-white text-xs font-medium">
            2
          </span>
        </div>
      </div>

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
            className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
              selectedPayment === method.id
                ? 'border-indigo-700 bg-indigo-50'
                : 'border-amber-200 hover:border-indigo-400'
            }`}
            onClick={() => handlePaymentMethodSelect(method.id)}
          >
            <div className="flex items-center flex-1 gap-3">
              <Image
                src={method.icon}
                alt=""
                width={48}
                height={48}
                className="object-contain p-1 flex-shrink-0"
                aria-hidden="true"
              />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  {t(`checkout.payment.methods.${method.id}`, method.name)}
                </h3>
                <p className="text-sm text-gray-500">
                  {t(`checkout.payment.descriptions.${method.id}`, method.description)}
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedPayment === method.id ? 'border-indigo-700' : 'border-gray-300'
              }`}
            >
              {selectedPayment === method.id && (
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-700" />
              )}
            </div>
            {method.id !== 'cod' && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                  {t('checkout.payment.coming_soon', 'Coming soon')}
                </span>
              </div>
            )}
          </div>
        ))}
      </fieldset>

      <div className="mt-8 flex justify-between gap-4">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-6 py-3 border border-amber-200 text-gray-700 font-medium rounded-full hover:bg-amber-50 transition-colors text-sm"
        >
          {t('checkout.actions.back_to_shipping', 'Back to Delivery')}
        </button>
        <button
          onClick={handlePaymentSubmit}
          disabled={isProcessing}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-full py-3 px-8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isProcessing ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>{t('checkout.actions.processing', 'Processing...')}</span>
            </>
          ) : (
            <>
              {t('checkout.actions.place_order', 'Place order')}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  // ── Delivery step — Stitch design ─────────────────────────────────────────
  const shippingMethodOptions: Array<{
    key: ShippingMethodKey;
    icon: React.ReactNode;
    name: string;
    eta: string;
    price: string;
  }> = [
    {
      key: 'standard',
      icon: <Truck className="w-5 h-5 text-indigo-700" />,
      name: t('checkout.shipping.methods.standard.name', 'Standard Delivery'),
      eta: t('checkout.shipping.methods.standard.eta', '3–5 business days'),
      price:
        subtotal >= 500
          ? t('checkout.shipping.methods.standard.free', 'Free')
          : '30 MAD',
    },
    {
      key: 'express',
      icon: <Zap className="w-5 h-5 text-indigo-700" />,
      name: t('checkout.shipping.methods.express.name', 'Express Delivery'),
      eta: t('checkout.shipping.methods.express.eta', '1–2 business days'),
      price: '70 MAD',
    },
    {
      key: 'pickup',
      icon: <Store className="w-5 h-5 text-indigo-700" />,
      name: t('checkout.shipping.methods.pickup.name', 'Pickup — Tetouan'),
      eta: t('checkout.shipping.methods.pickup.eta', 'Ready next business day'),
      price: t('checkout.shipping.methods.pickup.free', 'Free'),
    },
  ];

  const renderDeliveryStep = () => (
    <form
      id="checkout-delivery"
      onSubmit={handleShippingSubmit}
      className="space-y-6"
      noValidate
    >
      {/* Contact card */}
      <section className="bg-white ring-1 ring-amber-200 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-5" style={playfair}>
          {t('checkout.contact.title', 'Contact')}
        </h2>
        <div className="space-y-4">
          {/* Email pill */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                  ? 'ring-red-400 focus:ring-red-500'
                  : 'ring-amber-200 focus:ring-indigo-500'
              } pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition`}
              aria-invalid={touchedFields.email && !!validationErrors.email}
            />
          </div>
          {touchedFields.email && validationErrors.email && (
            <p className="text-xs text-red-600" role="alert">
              {validationErrors.email}
            </p>
          )}

          {/* Updates checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendUpdates}
              onChange={(e) => setSendUpdates(e.target.checked)}
              className="w-4 h-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400 bg-amber-50"
            />
            <span className="text-sm text-gray-600">
              {t(
                'checkout.contact.updates_label',
                'Send me order updates and offers'
              )}
            </span>
          </label>
        </div>
      </section>

      {/* Delivery address card */}
      <section className="bg-white ring-1 ring-amber-200 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-5" style={playfair}>
          {t('checkout.address.title', 'Delivery address')}
        </h2>

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
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                value={shippingInfo.firstName}
                onChange={handleShippingChange}
                placeholder={t('checkout.address.full_name_placeholder', 'Ahmed Benali')}
                className={`${inputClass()} pl-9`}
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
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                className={`${inputClass('phone')} pl-9`}
                aria-invalid={touchedFields.phone && !!validationErrors.phone}
              />
            </div>
            {touchedFields.phone && validationErrors.phone && (
              <p className="text-xs text-red-600 mt-1" role="alert">
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
            >
              <option value="">{t('common.select_option', 'Select country')}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {getCountryName(c.code, t)}
                </option>
              ))}
            </select>
            {touchedFields.country && validationErrors.country && (
              <p className="text-xs text-red-600 mt-1" role="alert">
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
            />
            {touchedFields.city && validationErrors.city && (
              <p className="text-xs text-red-600 mt-1" role="alert">
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
            />
            {touchedFields.state && validationErrors.state && (
              <p className="text-xs text-red-600 mt-1" role="alert">
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
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                className={`${inputClass('address')} pl-9`}
                aria-invalid={touchedFields.address && !!validationErrors.address}
              />
            </div>
            {touchedFields.address && validationErrors.address && (
              <p className="text-xs text-red-600 mt-1" role="alert">
                {validationErrors.address}
              </p>
            )}
          </div>

          {/* Postal code */}
          <div>
            <label
              htmlFor="postalCode"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {t('checkout.address.postal_code', 'Postal code')}
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                autoComplete="postal-code"
                value={shippingInfo.postalCode}
                onChange={handleShippingChange}
                placeholder="20000"
                className={`${inputClass()} pl-9`}
              />
            </div>
          </div>

          {/* Apartment — spans 2 on sm, 1 col */}
          <div>
            <label
              htmlFor="apartment"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {t('checkout.address.apartment', 'Apartment, suite, etc.')}{' '}
              <span className="text-gray-400 font-normal text-xs">
                ({t('common.optional', 'optional')})
              </span>
            </label>
            <input
              type="text"
              id="apartment"
              name="apartment"
              autoComplete="address-line2"
              value={shippingInfo.apartment}
              onChange={handleShippingChange}
              placeholder={t('checkout.address.apartment_placeholder', 'Apt 4B')}
              className={inputClass()}
            />
          </div>
        </div>
      </section>

      {/* Shipping method card */}
      <section className="bg-white ring-1 ring-amber-200 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-5" style={playfair}>
          {t('checkout.shipping.title', 'Shipping method')}
        </h2>

        <div className="space-y-3">
          {shippingMethodOptions.map((opt) => {
            const isSelected = shippingMethod === opt.key;
            return (
              <label
                key={opt.key}
                className={`flex items-start gap-3 p-4 rounded-xl ring-1 cursor-pointer transition-colors ${
                  isSelected
                    ? 'ring-2 ring-indigo-700 bg-indigo-50'
                    : 'ring-amber-200 hover:bg-amber-50/50'
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
                <span className="mt-0.5 flex-shrink-0">{opt.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{opt.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.eta}</p>
                </div>
                {/* expect: free-shipping price shows amber-600 (not green-600) per palette */}
                <span
                  className={`text-sm font-semibold flex-shrink-0 ${
                    opt.price === 'Free' || opt.price === t('checkout.shipping.methods.standard.free', 'Free') || opt.price === t('checkout.shipping.methods.pickup.free', 'Free')
                      ? 'text-amber-600'
                      : 'text-gray-900'
                  }`}
                >
                  {opt.price}
                </span>
              </label>
            );
          })}
        </div>
      </section>
    </form>
  );

  // ── Order summary (right column) ──────────────────────────────────────────
  const renderOrderSummary = () => (
    <div className="bg-white ring-1 ring-amber-200 rounded-2xl p-6 lg:sticky lg:top-24 self-start">
      {/* Kicker */}
      <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-4">
        {t('checkout.summary.kicker', 'Order Summary')}
      </p>

      {/* Line items */}
      <ul className="space-y-3 mb-5">
        {cartState.items.map((item) => {
          const productName =
            i18n.language === 'ar' ? item.product.name_ar : item.product.name;
          return (
            <li key={item.id} className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex-shrink-0 rounded-lg ring-1 ring-amber-200 overflow-hidden bg-amber-50">
                <Image
                  src={getImageUrl(item.product.image_url, '/placeholder.png')}
                  alt={productName || 'Product image'}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {productName}
                </p>
                <p className="text-xs text-gray-500">
                  {t('checkout.summary.qty', 'Qty')} {item.quantity}
                </p>
              </div>
              <span className="text-sm font-semibold text-indigo-700 flex-shrink-0">
                {(item.unit_price * item.quantity).toFixed(2)} MAD
              </span>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-amber-200 pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">{t('checkout.summary.subtotal', 'Subtotal')}</span>
          <span className="text-gray-900 font-medium">{subtotal.toFixed(2)} MAD</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{t('checkout.summary.shipping', 'Shipping')}</span>
          <span className="text-gray-900 font-medium">
            {shippingAmount > 0
              ? `${shippingAmount.toFixed(2)} MAD`
              : subtotal >= 500
              ? t('cart.summary.free', 'Free')
              : '—'}
          </span>
        </div>
        {taxAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">{t('checkout.summary.tax', 'Tax')}</span>
            <span className="text-gray-900 font-medium">{taxAmount.toFixed(2)} MAD</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">{t('checkout.summary.discount', 'Discount')}</span>
            {/* expect: discount "good news" uses amber-600 (green not in palette per DESIGN.md §2) */}
            <span className="text-amber-600 font-medium">-{discountAmount.toFixed(2)} MAD</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex items-baseline justify-between mt-4 mb-6 pt-4 border-t border-amber-200">
        <span className="text-gray-700 font-medium text-sm">
          {t('checkout.summary.total', 'Total')}
        </span>
        <span
          className="text-2xl font-bold text-indigo-700"
          style={playfair}
        >
          {totalAmount.toFixed(2)} MAD
        </span>
      </div>

      {/* COD reassurance banner — shown before the Place Order CTA so buyers see it before confirming */}
      {selectedPayment === 'cod' && step === 2 && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 ring-1 ring-amber-200 rounded-xl text-xs text-amber-900 mb-4">
          <Truck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{t('checkout.cod.pay_on_delivery', 'Pay on delivery — no upfront payment')}</p>
            <p className="mt-0.5 text-amber-700">{t('checkout.cod.delivery_estimate', 'Delivered in 3–5 business days. Pay the courier when you receive your order.')}</p>
          </div>
        </div>
      )}

      {/* CTA */}
      {step === 1 ? (
        <button
          type="submit"
          form="checkout-delivery"
          className="w-full inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t('checkout.actions.continue_payment', 'Continue to payment')}
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePaymentSubmit}
          disabled={isProcessing}
          className="w-full inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-full py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('checkout.actions.processing', 'Processing...')}
            </>
          ) : (
            <>
              {t('checkout.actions.place_order', 'Place order')}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      {/* Trust micro-pills */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-amber-50 ring-1 ring-amber-200 rounded-full px-3 py-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          {t('cart.trust.secure', 'Secure payments')}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-amber-50 ring-1 ring-amber-200 rounded-full px-3 py-1.5">
          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
          {t('cart.trust.returns', 'Free 14-day returns')}
        </span>
      </div>

      {/* Payment methods */}
      <p className="text-center text-xs text-gray-400 mt-3">
        {t(
          'cart.payment_methods',
          'We accept Visa · Mastercard · Cash on Delivery'
        )}
      </p>
    </div>
  );

  // ── Stepper strip ─────────────────────────────────────────────────────────
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
      completed: false,
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

  return (
    <div className={`min-h-screen bg-amber-50/40 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* ── Stepper strip ─────────────────────────────────────────────────── */}
      <div className="bg-amber-50 border-b border-amber-200 py-5">
        <div className="max-w-7xl mx-auto px-6">
          <nav aria-label={t('checkout.stepper.aria_label', 'Checkout progress')}>
            <ol className="flex items-center justify-center gap-0" role="list">
              {steps.map((s, idx) => (
                <li key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center relative">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        s.completed
                          ? 'bg-indigo-700 text-white'
                          : s.active
                          ? 'bg-indigo-700 text-white ring-2 ring-amber-300'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                      aria-current={s.active ? 'step' : undefined}
                    >
                      {s.active ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      ) : s.completed ? (
                        '✓'
                      ) : (
                        s.id
                      )}
                    </span>
                    <span
                      className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                        s.active
                          ? 'text-indigo-700'
                          : s.completed
                          ? 'text-amber-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="w-16 sm:w-24 h-px bg-amber-200 mx-2 mb-5" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* ── Page heading ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-2">
          {step === 1
            ? t('checkout.heading.kicker', 'STEP 2 OF 4')
            : t('checkout.heading.kicker_payment', 'STEP 3 OF 4')}
        </p>
        <h1
          className="text-3xl sm:text-4xl font-bold text-gray-900"
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
      icon: <BadgeCheck className="w-7 h-7 text-amber-500" />,
      label: t('checkout.reassurance.verified', 'Verified Sellers'),
    },
    {
      icon: <ShieldCheck className="w-7 h-7 text-amber-500" />,
      label: t('checkout.reassurance.authentic', 'Authentic Craft'),
    },
    {
      icon: <RotateCcw className="w-7 h-7 text-amber-500" />,
      label: t('checkout.reassurance.returns', 'Free Returns'),
    },
    {
      icon: <Headphones className="w-7 h-7 text-amber-500" />,
      label: t('checkout.reassurance.support', 'Multilingual Support'),
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

// ── Bespoke strip ─────────────────────────────────────────────────────────────
function BespokeStrip({ t }: { t: (k: string, fb: string) => string }) {
  return (
    <section className="bg-indigo-900 py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, #f59e0b 0, transparent 45%), radial-gradient(circle at 80% 60%, #6366f1 0, transparent 50%)',
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center flex flex-col md:flex-row items-center justify-center gap-8">
        <h2
          className="text-3xl md:text-4xl font-bold text-white"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          {t('cart.bespoke.headline', 'Want it tailored to you?')}
        </h2>
        <Link
          href="/services/tailoring"
          className="inline-flex items-center justify-center px-8 py-3 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold rounded-full transition-colors text-sm"
        >
          {t('checkout.bespoke.cta', 'Explore bespoke')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    </section>
  );
}
