'use client';

import { useTranslation } from 'react-i18next';
import { TruckIcon, ClockIcon, ShieldCheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

export default function ShippingPage() {
  const { t } = useTranslation();

  const deliveryOptions = [
    {
      name: t('pages.shipping.standardShipping'),
      description: t('pages.shipping.standardDays'),
      price: t('pages.shipping.standardCost'),
      icon: TruckIcon,
    },
    {
      name: t('pages.shipping.expressShipping'),
      description: t('pages.shipping.expressDays'),
      price: t('pages.shipping.expressCost'),
      icon: ClockIcon,
    },
    {
      name: t('pages.shipping.internationalShipping'),
      description: t('pages.shipping.internationalDays'),
      price: t('pages.shipping.internationalCost'),
      icon: GlobeAltIcon,
    },
  ];

  const shippingFaqs = [
    {
      question: 'How can I track my order?',
      answer:
        'You can track your order by logging into your account and visiting the Orders section. There, you\'ll find tracking information for all your orders. Alternatively, you can use the tracking number provided in your shipping confirmation email.',
    },
    {
      question: 'What are the shipping costs?',
      answer:
        'Shipping costs vary based on your location and the shipping method selected. Standard shipping within Morocco is 30 DH, express shipping is 50 DH, and international shipping starts from 150 DH.',
    },
    {
      question: 'Do you ship internationally?',
      answer:
        'Yes, we ship internationally to most countries. International shipping rates start from 150 DH depending on the destination and package weight.',
    },
    {
      question: 'How long will it take to receive my order?',
      answer:
        'Delivery times depend on your location and the shipping method selected. Standard shipping within Morocco takes 5-7 business days, express shipping takes 2-3 business days, and international shipping takes 7-14 business days.',
    },
    {
      question: 'What should I do if my order hasn\'t arrived?',
      answer:
        'If your order hasn\'t arrived within the expected delivery timeframe, please contact our customer service team through the Contact Us page or via email at support@beldify.com.',
    },
  ];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl py-8 px-4 sm:py-12 sm:px-6 lg:py-16 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">{t('pages.shipping.title')}</h1>
          <p className="mx-auto mt-3 md:mt-4 max-w-3xl text-sm md:text-base text-gray-500">
            {t('pages.shipping.subtitle')}
          </p>
        </div>

        {/* Shipping Options */}
        <div className="mt-10 md:mt-16">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t('pages.shipping.deliveryOptions')}</h2>
          <div className="mt-4 md:mt-6 grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {deliveryOptions.map((option) => (
              <div
                key={option.name}
                className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-indigo-400"
              >
                <div>
                  <span className="inline-flex rounded-lg bg-indigo-50 p-2 md:p-3">
                    <option.icon className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-3 md:mt-4">
                  <h3 className="text-base md:text-lg font-medium text-gray-900">
                    <span className="focus:outline-none">
                      {option.name}
                    </span>
                  </h3>
                  <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-500">{option.description}</p>
                  <p className="mt-1 md:mt-2 text-xs md:text-sm font-semibold text-indigo-600">{option.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Policies */}
        <div className="mt-10 md:mt-16">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t('pages.shipping.shippingPolicy')}</h2>
          <div className="mt-4 md:mt-6 rounded-lg bg-gray-50 px-4 py-6 sm:px-6 sm:py-8 md:p-10">
            <div className="flow-root">
              <ul role="list" className="space-y-4 md:space-y-6">
                <li className="flex">
                  <ShieldCheckIcon className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0 text-indigo-500 mt-0.5" aria-hidden="true" />
                  <span className="ml-3 text-sm md:text-base text-gray-700">
                    <strong className="font-semibold text-gray-900">{t('pages.shipping.processingTime')}:</strong> {t('pages.shipping.processingText')}
                  </span>
                </li>
                <li className="flex">
                  <ShieldCheckIcon className="h-6 w-6 flex-shrink-0 text-indigo-500" aria-hidden="true" />
                  <span className="ml-3 text-base text-gray-700">
                    <strong className="font-semibold text-gray-900">Shipping Confirmation:</strong> You will receive a
                    shipping confirmation email with tracking information once your order has been shipped.
                  </span>
                </li>
                <li className="flex">
                  <ShieldCheckIcon className="h-6 w-6 flex-shrink-0 text-indigo-500" aria-hidden="true" />
                  <span className="ml-3 text-base text-gray-700">
                    <strong className="font-semibold text-gray-900">Delivery Days:</strong> We deliver Monday through
                    Friday, excluding public holidays.
                  </span>
                </li>
                <li className="flex">
                  <ShieldCheckIcon className="h-6 w-6 flex-shrink-0 text-indigo-500" aria-hidden="true" />
                  <span className="ml-3 text-base text-gray-700">
                    <strong className="font-semibold text-gray-900">Address Changes:</strong> Once an order has been
                    placed, the shipping address cannot be changed.
                  </span>
                </li>
                <li className="flex">
                  <ShieldCheckIcon className="h-6 w-6 flex-shrink-0 text-indigo-500" aria-hidden="true" />
                  <span className="ml-3 text-base text-gray-700">
                    <strong className="font-semibold text-gray-900">Package Handling:</strong> All packages are handled with
                    care and are insured against loss or damage during shipping.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Shipping FAQs */}
        <div className="mt-10 md:mt-16">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t('pages.shipping.faqsTitle')}</h2>
          <div className="mt-4 md:mt-6">
            <dl className="divide-y divide-gray-200">
              {shippingFaqs.map((faq) => (
                <div key={faq.question} className="py-4 md:py-6 md:grid md:grid-cols-12 md:gap-6 lg:gap-8">
                  <dt className="text-sm md:text-base font-medium text-gray-900 md:col-span-5">{faq.question}</dt>
                  <dd className="mt-2 md:mt-0 md:col-span-7">
                    <p className="text-sm md:text-base text-gray-500">{faq.answer}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-10 md:mt-16 bg-indigo-50 rounded-lg overflow-hidden shadow">
          <div className="px-4 py-6 sm:px-6 sm:py-8 md:p-10">
            <div className="max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-4 md:gap-y-6 items-center">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">{t('pages.shipping.needHelp')}</h3>
                  <p className="mt-2 md:mt-3 text-sm md:text-base text-gray-500">
                    {t('pages.shipping.helpText')}
                  </p>
                </div>
                <div className="flex md:justify-end">
                  <a
                    href="/contact"
                    className="inline-flex w-full md:w-auto items-center justify-center px-4 md:px-6 py-2 md:py-3 border border-transparent rounded-md shadow-sm text-sm md:text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {t('pages.shipping.contactSupport')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
