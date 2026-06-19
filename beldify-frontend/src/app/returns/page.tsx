'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  PackageOpen,
  Clock,
  LogIn,
} from 'lucide-react';
import Link from 'next/link';
import { orderService, Order } from '@/services/orderService';
import { returnService, ReturnRequest, ReturnRequestStatus } from '@/services/returnService';
import logger from '@/utils/consoleLogger';

// ─── Return-request section (auth-gated) ──────────────────────────────────────

const RETURN_REASONS = [
  'damaged',
  'wrong_item',
  'not_as_described',
  'size_issue',
  'other',
] as const;
type ReturnReason = typeof RETURN_REASONS[number];

function getReturnStatusPill(status: ReturnRequestStatus) {
  const map: Record<ReturnRequestStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    completed: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  };
  return map[status] ?? map.pending;
}

function RequestReturnSection() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [reason, setReason] = useState<ReturnReason | ''>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [existingRequest, setExistingRequest] = useState<ReturnRequest | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load delivered orders when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    orderService
      .getOrders()
      .then((all) => {
        const delivered = all.filter((o) => o.status === 'delivered');
        setOrders(delivered);
      })
      .catch((err) => logger.error('Failed to load orders for return:', err))
      .finally(() => setLoadingOrders(false));
  }, [isAuthenticated]);

  // When user selects an order, check if a return request already exists
  const checkExistingRequest = useCallback(async (orderNumber: string) => {
    if (!orderNumber) {
      setExistingRequest(null);
      return;
    }
    setLoadingExisting(true);
    try {
      const req = await returnService.get(orderNumber);
      setExistingRequest(req);
    } catch {
      setExistingRequest(null);
    } finally {
      setLoadingExisting(false);
    }
  }, []);

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedOrderNumber(val);
    setSubmitError('');
    setSubmitted(false);
    checkExistingRequest(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!selectedOrderNumber) {
      setSubmitError(t('returns.request.order_required', 'Please select an order.'));
      return;
    }
    if (!reason) {
      setSubmitError(t('returns.request.reason_required', 'Please select a reason.'));
      return;
    }
    setIsSubmitting(true);
    try {
      await returnService.create(selectedOrderNumber, {
        reason,
        details: details.trim() || undefined,
      });
      setSubmitted(true);
      // Refresh existing request
      await checkExistingRequest(selectedOrderNumber);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setSubmitError(
        msg || t('returns.request.submit_error', 'Could not submit your return request. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-200 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center">
          <LogIn className="w-5 h-5 text-amber-600" aria-hidden />
        </div>
        <div>
          <h3
            className="text-base font-semibold text-gray-900 mb-1"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('returns.request.login_title', 'Sign in to request a return')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('returns.request.login_desc', 'You need to be logged in to submit a return request for your order.')}
          </p>
        </div>
        <Link
          href="/login?redirect=/returns"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-700 text-white text-sm font-semibold hover:bg-indigo-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700"
        >
          {t('auth.sign_in', 'Sign in')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-200">
      <h2
        className="text-xl font-bold text-gray-900 mb-2"
        style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
      >
        {t('returns.request.title', 'Request a return')}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {t('returns.request.desc', 'Select a delivered order and tell us what went wrong. Returns must be requested within 14 days of delivery.')}
      </p>

      {/* No delivered orders */}
      {!loadingOrders && orders.length === 0 && (
        <div className="text-center py-8 text-sm text-gray-500 space-y-2">
          <PackageOpen className="w-8 h-8 mx-auto text-gray-300" aria-hidden />
          <p>{t('returns.request.no_delivered', 'No delivered orders found that are eligible for a return.')}</p>
        </div>
      )}

      {loadingOrders && (
        <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-indigo-700 animate-spin flex-shrink-0" />
          {t('returns.request.loading_orders', 'Loading your orders…')}
        </div>
      )}

      {!loadingOrders && orders.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Order select */}
          <div>
            <label htmlFor="return-order" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('returns.request.select_order', 'Order')}
            </label>
            <select
              id="return-order"
              value={selectedOrderNumber}
              onChange={handleOrderChange}
              className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20"
            >
              <option value="">{t('returns.request.select_order_placeholder', '— Select an order —')}</option>
              {orders.map((o) => (
                <option key={o.order_number} value={o.order_number}>
                  #{o.order_number}
                </option>
              ))}
            </select>
          </div>

          {/* Loading existing request indicator */}
          {loadingExisting && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-indigo-700 animate-spin flex-shrink-0" />
              {t('returns.request.checking', 'Checking for existing requests…')}
            </div>
          )}

          {/* Existing request badge */}
          {!loadingExisting && existingRequest && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 space-y-2">
              <p className="text-sm font-medium text-amber-900">
                {t('returns.request.existing_title', 'An existing return request was found for this order.')}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{t('returns.request.status_label', 'Status:')}</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getReturnStatusPill(existingRequest.status)}`}
                >
                  {t(`returns.status.${existingRequest.status}`, existingRequest.status)}
                </span>
              </div>
              {existingRequest.reason && (
                <p className="text-xs text-gray-500">
                  {t('returns.request.reason_label', 'Reason:')} {t(`returns.reason.${existingRequest.reason}`, existingRequest.reason)}
                </p>
              )}
            </div>
          )}

          {/* Only show form fields if no existing request */}
          {!existingRequest && selectedOrderNumber && !loadingExisting && (
            <>
              {/* Reason select */}
              <div>
                <label htmlFor="return-reason" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('returns.request.reason', 'Reason for return')}
                </label>
                <select
                  id="return-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReturnReason)}
                  className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20"
                >
                  <option value="">{t('returns.request.reason_placeholder', '— Select a reason —')}</option>
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {t(`returns.reason.${r}`, r.replace(/_/g, ' '))}
                    </option>
                  ))}
                </select>
              </div>

              {/* Details textarea */}
              <div>
                <label htmlFor="return-details" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('returns.request.details', 'Additional details (optional)')}
                </label>
                <textarea
                  id="return-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder={t('returns.request.details_placeholder', 'Describe the issue in more detail…')}
                  className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/20 resize-none"
                />
                <p className="mt-1 text-xs text-gray-400 text-end">
                  {details.length}/500
                </p>
              </div>
            </>
          )}

          {/* Error banner */}
          {submitError && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          {/* Success banner */}
          {submitted && (
            <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden />
              <p className="text-sm font-medium text-emerald-800">
                {t('returns.request.success', 'Return request submitted. Our team will review it shortly.')}
              </p>
            </div>
          )}

          {/* Submit — only when form is visible */}
          {!existingRequest && selectedOrderNumber && !loadingExisting && !submitted && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              aria-busy={isSubmitting}
            >
              {isSubmitting && (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin flex-shrink-0" />
              )}
              {isSubmitting
                ? t('returns.request.submitting', 'Submitting…')
                : t('returns.request.submit', 'Submit return request')}
            </button>
          )}
        </form>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ReturnsPage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('returns');
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';

  const steps = [
    {
      id: 1,
      name: t('pages.returns.steps.step1.name', 'Initiate Return'),
      description: t('pages.returns.steps.step1.description', 'Start your return through our online portal'),
    },
    {
      id: 2,
      name: t('pages.returns.steps.step2.name', 'Package Items'),
      description: t('pages.returns.steps.step2.description', 'Securely pack your items with original packaging'),
    },
    {
      id: 3,
      name: t('pages.returns.steps.step3.name', 'Ship Back'),
      description: t('pages.returns.steps.step3.description', 'Send items back at your cost (defective or incorrect items are covered by Beldify)'),
    },
    {
      id: 4,
      name: t('pages.returns.steps.step4.name', 'Get Refunded'),
      description: t('pages.returns.steps.step4.description', 'Receive your refund once we process the return'),
    },
  ];

  const returnableItems = [
    t('pages.returns.returnableItems.item1', 'Unworn, unwashed clothing with tags attached'),
    t('pages.returns.returnableItems.item2', 'Unused accessories with original packaging'),
    t('pages.returns.returnableItems.item3', 'Unopened beauty and personal care items'),
    t('pages.returns.returnableItems.item4', 'Faulty items (within warranty period)'),
    t('pages.returns.returnableItems.item5', 'Items in original condition with all parts included'),
  ];

  const nonReturnableItems = [
    t('pages.returns.nonReturnableItems.item1', 'Custom-made or personalized items'),
    t('pages.returns.nonReturnableItems.item2', 'Intimate apparel (underwear, swimwear, hosiery)'),
    t('pages.returns.nonReturnableItems.item3', "Items marked as 'Final Sale' or clearance"),
    t('pages.returns.nonReturnableItems.item4', 'Items without original packaging or tags'),
    t('pages.returns.nonReturnableItems.item5', 'Used or damaged items'),
    t('pages.returns.nonReturnableItems.item6', 'Gift cards and digital products'),
  ];

  const tabs = [
    { id: 'returns', label: t('pages.returns.tabs.returnsPolicy', 'Returns Policy') },
    { id: 'exchanges', label: t('pages.returns.tabs.exchanges', 'Exchanges') },
    { id: 'process', label: t('pages.returns.tabs.returnProcess', 'Return Process') },
    { id: 'request', label: t('pages.returns.tabs.request', 'Request a Return') },
  ];

  return (
    <div className="min-h-screen bg-canvas py-16 sm:py-20" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Page header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-3">
            {t('navigation.account', 'My Account')}
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {isRTL
              ? t('pages.returns.title', 'الإرجاع والاسترداد')
              : t('pages.returns.title', 'Returns & Refunds')}
          </h1>
          <p className="max-w-2xl mx-auto text-gray-500 text-sm sm:text-base">
            {t('pages.returns.subtitle', 'Our policy and process for returns and exchanges')}
          </p>
        </div>

        {/* Tab navigation */}
        <nav
          className="flex justify-center mb-10 gap-1 bg-white rounded-2xl p-1.5 max-w-xl mx-auto shadow-sm ring-1 ring-gray-200"
          aria-label={t('account.returns.tabs_label', 'Returns and refunds navigation')}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-amber-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="max-w-4xl mx-auto">
          {/* Returns Policy Tab */}
          {activeTab === 'returns' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-200">
                <h2
                  className="text-xl font-bold text-gray-900 mb-4"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {t('pages.returns.returnsPolicy.title', 'Returns Policy')}
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  {t('pages.returns.returnsPolicy.policy1', 'We want you to be completely satisfied with your purchase.')}
                </p>
                <p className="text-sm text-gray-600">
                  {t('pages.returns.returnsPolicy.policy2', 'To be eligible for a return, your item must be unused and in the same condition.')}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-200">
                <h3
                  className="text-base font-semibold text-gray-900 mb-2"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {t('pages.returns.refunds.title', 'Refunds')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('pages.returns.refunds.description', 'Once we receive your return, we will inspect it and notify you.')}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-200">
                <h3
                  className="text-base font-semibold text-gray-900 mb-2"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {t('pages.returns.returnShipping.title', 'Return Shipping')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('pages.returns.returnShipping.description', 'Return shipping is the buyer\'s responsibility. Beldify covers return shipping only for defective or incorrect items.')}
                </p>
              </div>

              {/* Returnable / Non-returnable grids */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-200">
                  <h3
                    className="text-base font-semibold text-gray-900 mb-4"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    {t('pages.returns.returnableItems.title', 'Eligible for Return')}
                  </h3>
                  <ul className="space-y-2.5">
                    {returnableItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-200">
                  <h3
                    className="text-base font-semibold text-gray-900 mb-4"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    {t('pages.returns.nonReturnableItems.title', 'Not Eligible for Return')}
                  </h3>
                  <ul className="space-y-2.5">
                    {nonReturnableItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <XCircle className="h-4 w-4 text-rose-700 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Exchanges Tab */}
          {activeTab === 'exchanges' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-200">
                <h2
                  className="text-xl font-bold text-gray-900 mb-4"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {t('pages.returns.exchanges.title', 'Exchanges')}
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  {t('pages.returns.exchanges.description', 'We\'re happy to help you exchange items for a different size or color.')}
                </p>

                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('pages.returns.exchanges.requestTitle', 'How to Request an Exchange')}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {t('pages.returns.exchanges.requestDescription', 'Follow these steps to exchange an item:')}
                </p>
                <ol className="space-y-2 mb-6">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                        {n}
                      </span>
                      {t(`pages.returns.exchanges.step${n}`, `Step ${n}`)}
                    </li>
                  ))}
                </ol>

                <p className="text-sm text-gray-600">
                  {t('pages.returns.exchanges.processDescription', 'Please note that exchanges are subject to stock availability.')}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-gray-200">
                <h3
                  className="text-base font-semibold text-gray-900 mb-3"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {t('pages.returns.exchanges.eligibilityTitle', 'Exchange Eligibility')}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {t('pages.returns.exchanges.eligibilityDescription', 'To be eligible for an exchange, your item must meet the following criteria:')}
                </p>
                <ul className="space-y-2">
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      {t(`pages.returns.exchanges.eligibility${n}`, `Criteria ${n}`)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {t('pages.returns.exchanges.priceDiffTitle', 'Price Differences')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('pages.returns.exchanges.priceDiffDescription', 'If the replacement item is more expensive, you\'ll be charged the difference.')}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {t('pages.returns.exchanges.internationalTitle', 'International Exchanges')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('pages.returns.exchanges.internationalDescription', 'All customers are responsible for return shipping costs. Beldify covers return shipping only for defective or incorrect items.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Return Process Tab */}
          {activeTab === 'process' && (
            <div className="space-y-8">
              <h2
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
              >
                {t('pages.returns.process.title', 'Our Return Process')}
              </h2>

              {/* Steps grid */}
              <div className="grid sm:grid-cols-2 gap-6">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-200 flex gap-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-700 text-white flex items-center justify-center text-sm font-semibold">
                      {step.id}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">{step.name}</h3>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Process illustration — external Contabo storage domain is not in next.config
                  remotePatterns, so next/image would error at runtime; plain <img> is correct here. */}
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://eu2.contabostorage.com/c7737d32901c47be91e8263ad074fd38:beldify1storage/assets/return-process.svg"
                  alt={t('account.returns.process_illustration_alt', 'Return process illustration')}
                  className="h-40 w-auto"
                />
              </div>

              {/* Help callout */}
              <div className="bg-indigo-700 rounded-2xl p-6 sm:p-8 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="h-6 w-6 text-amber-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white text-base mb-1">
                        {t('pages.returns.process.needHelp', 'Need Help?')}
                      </h3>
                      <p className="text-indigo-200 text-sm">
                        {t('pages.returns.process.helpDescription', 'Our support team is ready to assist with your return.')}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/contact"
                    className="flex-shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-amber-400 text-gray-900 text-sm font-semibold hover:bg-amber-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-amber-400"
                  >
                    {t('pages.returns.process.contactSupport', 'Contact Support')}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Request a Return Tab */}
          {activeTab === 'request' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <RequestReturnSection />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
