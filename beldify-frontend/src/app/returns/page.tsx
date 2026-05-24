'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function ReturnsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('returns');

  const steps = [
    {
      id: 1,
      name: t('pages.returns.steps.step1.name'),
      description: t('pages.returns.steps.step1.description'),
    },
    {
      id: 2,
      name: t('pages.returns.steps.step2.name'),
      description: t('pages.returns.steps.step2.description'),
    },
    {
      id: 3,
      name: t('pages.returns.steps.step3.name'),
      description: t('pages.returns.steps.step3.description'),
    },
    {
      id: 4,
      name: t('pages.returns.steps.step4.name'),
      description: t('pages.returns.steps.step4.description'),
    },
  ];

  // Returnable and non-returnable items
  const returnableItems = [
    t('pages.returns.returnableItems.item1'),
    t('pages.returns.returnableItems.item2'),
    t('pages.returns.returnableItems.item3'),
    t('pages.returns.returnableItems.item4'),
    t('pages.returns.returnableItems.item5')
  ];

  const nonReturnableItems = [
    t('pages.returns.nonReturnableItems.item1'),
    t('pages.returns.nonReturnableItems.item2'),
    t('pages.returns.nonReturnableItems.item3'),
    t('pages.returns.nonReturnableItems.item4'),
    t('pages.returns.nonReturnableItems.item5'),
    t('pages.returns.nonReturnableItems.item6')
  ];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl py-8 px-4 sm:py-12 sm:px-6 lg:py-16 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">{t('pages.returns.title')}</h1>
          <p className="mx-auto mt-3 md:mt-4 max-w-3xl text-sm md:text-base text-gray-500">
            {t('pages.returns.subtitle')}
          </p>
        </div>

        {/* Tab navigation */}
        <div className="mt-8 sm:mt-12 flex justify-center border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('returns')}
              className={`${
                activeTab === 'returns'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 py-3 md:py-4 px-1 text-xs md:text-sm font-medium`}
            >
              {t('pages.returns.tabs.returnsPolicy')}
            </button>
            <button
              onClick={() => setActiveTab('exchanges')}
              className={`${
                activeTab === 'exchanges'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 py-3 md:py-4 px-1 text-xs md:text-sm font-medium`}
            >
              {t('pages.returns.tabs.exchanges')}
            </button>
            <button
              onClick={() => setActiveTab('process')}
              className={`${
                activeTab === 'process'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 py-3 md:py-4 px-1 text-xs md:text-sm font-medium`}
            >
              {t('pages.returns.tabs.returnProcess')}
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="mt-10">
          {/* Returns Policy Tab */}
          {activeTab === 'returns' && (
            <div>
              <div className="prose prose-indigo mx-auto">
                <h2>{t('pages.returns.returnsPolicy.title')}</h2>
                <p className="text-sm md:text-base">
                  {t('pages.returns.returnsPolicy.policy1')}
                </p>
                <p className="text-sm md:text-base">
                  {t('pages.returns.returnsPolicy.policy2')}
                </p>

                <h3 className="text-base md:text-lg">{t('pages.returns.refunds.title')}</h3>
                <p className="text-sm md:text-base">
                  {t('pages.returns.refunds.description')}
                </p>

                <h3 className="text-base md:text-lg">{t('pages.returns.returnShipping.title')}</h3>
                <p className="text-sm md:text-base">
                  {t('pages.returns.returnShipping.description')}
                </p>

                <h3 className="mt-6 md:mt-8 text-base md:text-lg">{t('pages.returns.returnableItems.title')}</h3>
                <ul>
                  {returnableItems.map((item, index) => (
                    <li key={index} className="flex items-start mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="mt-6 md:mt-8 text-base md:text-lg">{t('pages.returns.nonReturnableItems.title')}</h3>
                <ul>
                  {nonReturnableItems.map((item, index) => (
                    <li key={index} className="flex items-start mb-2">
                      <XCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Exchanges Tab */}
          {activeTab === 'exchanges' && (
            <div>
              <div className="prose prose-indigo mx-auto">
                <h2>{t('pages.returns.exchanges.title')}</h2>
                <p className="text-sm md:text-base">
                  {t('pages.returns.exchanges.description')}
                </p>

                <h3 className="text-base md:text-lg">{t('pages.returns.exchanges.requestTitle')}</h3>
                <p className="text-sm md:text-base">
                  {t('pages.returns.exchanges.requestDescription')}
                </p>
                <ol className="text-sm md:text-base">
                  <li>{t('pages.returns.exchanges.step1')}</li>
                  <li>{t('pages.returns.exchanges.step2')}</li>
                  <li>{t('pages.returns.exchanges.step3')}</li>
                  <li>{t('pages.returns.exchanges.step4')}</li>
                  <li>{t('pages.returns.exchanges.step5')}</li>
                </ol>

                <p className="text-sm md:text-base">
                  {t('pages.returns.exchanges.processDescription')}
                </p>

                <h3 className="text-base md:text-lg">{t('pages.returns.exchanges.eligibilityTitle')}</h3>
                <p className="text-sm md:text-base">
                  {t('pages.returns.exchanges.eligibilityDescription')}
                </p>
                <ul className="text-sm md:text-base">
                  <li>{t('pages.returns.exchanges.eligibility1')}</li>
                  <li>{t('pages.returns.exchanges.eligibility2')}</li>
                  <li>{t('pages.returns.exchanges.eligibility3')}</li>
                  <li>{t('pages.returns.exchanges.eligibility4')}</li>
                </ul>

                <h3 className="text-base md:text-lg">{t('pages.returns.exchanges.priceDiffTitle')}</h3>
                <p className="text-sm md:text-base">
                  {t('pages.returns.exchanges.priceDiffDescription')}
                </p>

                <h3 className="text-base md:text-lg">{t('pages.returns.exchanges.internationalTitle')}</h3>
                <p className="text-sm md:text-base">
                  {t('pages.returns.exchanges.internationalDescription')}
                </p>
              </div>
            </div>
          )}

          {/* Return Process Tab */}
          {activeTab === 'process' && (
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6 md:mb-8">{t('pages.returns.process.title')}</h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                <div className="space-y-6 sm:space-y-8">
                  {steps.slice(0, 2).map((step) => (
                    <div key={step.id} className="relative">
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                        {step.id}
                      </div>
                      <div className="mt-3">
                        <h3 className="text-lg font-medium text-gray-900">{step.name}</h3>
                        <p className="mt-2 text-sm text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 md:mt-8 lg:mt-0 flex justify-center">
                  <img
                    src="https://eu2.contabostorage.com/c7737d32901c47be91e8263ad074fd38:beldify1storage/assets/return-process.svg"
                    alt="Return process illustration"
                    className="mx-auto h-48 w-auto"
                  />
                </div>

                <div className="mt-6 md:mt-8 space-y-6 sm:space-y-8 lg:mt-0">
                  {steps.slice(2, 4).map((step) => (
                    <div key={step.id} className="relative">
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                        {step.id}
                      </div>
                      <div className="mt-3">
                        <h3 className="text-lg font-medium text-gray-900">{step.name}</h3>
                        <p className="mt-2 text-sm text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 md:mt-16 rounded-md bg-indigo-50 p-4 md:p-6">
                <div className="md:flex md:items-center md:justify-between">
                  <div className="flex md:flex-shrink-0">
                    <ArrowPathIcon className="h-6 w-6 text-indigo-600 mr-3" />
                    <div>
                      <h3 className="text-base md:text-lg font-medium text-indigo-900">{t('pages.returns.process.needHelp')}</h3>
                      <p className="mt-1 md:mt-2 text-xs md:text-sm text-indigo-700">
                        {t('pages.returns.process.helpDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 md:ml-6 md:mt-0">
                    <a
                      href="/contact"
                      className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      {t('pages.returns.process.contactSupport')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
