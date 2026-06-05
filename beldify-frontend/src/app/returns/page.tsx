'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, RefreshCw, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

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
      description: t('pages.returns.steps.step3.description', 'Use our prepaid return label to send items back'),
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
          className="flex justify-center mb-10 gap-1 bg-white rounded-2xl p-1.5 max-w-xl mx-auto shadow-sm ring-1 ring-amber-200"
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
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-amber-200">
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

              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-amber-200">
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

              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-amber-200">
                <h3
                  className="text-base font-semibold text-gray-900 mb-2"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {t('pages.returns.returnShipping.title', 'Return Shipping')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('pages.returns.returnShipping.description', 'Return shipping costs may apply depending on your location.')}
                </p>
              </div>

              {/* Returnable / Non-returnable grids */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-amber-200">
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

                <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-amber-200">
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
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-amber-200">
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

              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm ring-1 ring-amber-200">
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
                <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-amber-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {t('pages.returns.exchanges.priceDiffTitle', 'Price Differences')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('pages.returns.exchanges.priceDiffDescription', 'If the replacement item is more expensive, you\'ll be charged the difference.')}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-amber-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {t('pages.returns.exchanges.internationalTitle', 'International Exchanges')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('pages.returns.exchanges.internationalDescription', 'International customers are responsible for return shipping costs.')}
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
                    className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-amber-200 flex gap-4"
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

              {/* Process illustration */}
              <div className="flex justify-center">
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
        </div>
      </div>
    </div>
  );
}
