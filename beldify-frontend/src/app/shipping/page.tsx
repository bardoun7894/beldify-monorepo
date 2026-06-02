'use client';

import { useTranslation } from 'react-i18next';
import { Truck, Clock, Globe, ShieldCheck } from 'lucide-react';

export default function ShippingPage() {
  const { t } = useTranslation();

  const deliveryOptions = [
    {
      name: t('pages.shipping.standardShipping'),
      description: t('pages.shipping.standardDays'),
      price: t('pages.shipping.standardCost'),
      icon: Truck,
    },
    {
      name: t('pages.shipping.expressShipping'),
      description: t('pages.shipping.expressDays'),
      price: t('pages.shipping.expressCost'),
      icon: Clock,
    },
    {
      name: t('pages.shipping.internationalShipping'),
      description: t('pages.shipping.internationalDays'),
      price: t('pages.shipping.internationalCost'),
      icon: Globe,
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
      {/* Atlas editorial hero strip */}
      <div className="relative bg-indigo-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 15%, #f59e0b 0, transparent 45%), radial-gradient(circle at 85% 60%, #6366f1 0, transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400 font-medium mb-3">
            {t('pages.shipping.title')}
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('pages.shipping.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-indigo-200">
            {t('pages.shipping.subtitle')}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl py-12 px-6 lg:py-16 lg:px-8">
        {/* Shipping Options */}
        <div className="mt-2">
          <h2
            className="text-2xl font-bold text-indigo-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('pages.shipping.deliveryOptions')}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {deliveryOptions.map((option) => (
              <div
                key={option.name}
                className="relative rounded-2xl ring-1 ring-amber-200/60 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:ring-amber-300"
              >
                <div>
                  <span className="inline-flex rounded-xl bg-amber-50 p-3">
                    <option.icon className="h-6 w-6 text-amber-600" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-semibold text-indigo-900">
                    {option.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">{option.description}</p>
                  <p className="mt-2 text-sm font-semibold text-amber-700">{option.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Policies */}
        <div className="mt-16">
          <h2
            className="text-2xl font-bold text-indigo-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('pages.shipping.shippingPolicy')}
          </h2>
          <div className="mt-6 rounded-2xl bg-amber-50 px-6 py-8 sm:p-10">
            <div className="flow-root">
              <ul role="list" className="space-y-6">
                <li className="flex">
                  <ShieldCheck className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
                  <span className="ms-3 text-sm text-gray-700">
                    <strong className="font-semibold text-indigo-900">{t('pages.shipping.processingTime')}:</strong>{' '}
                    {t('pages.shipping.processingText')}
                  </span>
                </li>
                <li className="flex">
                  <ShieldCheck className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
                  <span className="ms-3 text-sm text-gray-700">
                    <strong className="font-semibold text-indigo-900">
                      {t('content.shipping.shippingConfirmation', 'Shipping Confirmation')}:
                    </strong>{' '}
                    {t('content.shipping.shippingConfirmationText', 'You will receive a shipping confirmation email with tracking information once your order has been shipped.')}
                  </span>
                </li>
                <li className="flex">
                  <ShieldCheck className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
                  <span className="ms-3 text-sm text-gray-700">
                    <strong className="font-semibold text-indigo-900">
                      {t('content.shipping.deliveryDays', 'Delivery Days')}:
                    </strong>{' '}
                    {t('content.shipping.deliveryDaysText', 'We deliver Monday through Friday, excluding public holidays.')}
                  </span>
                </li>
                <li className="flex">
                  <ShieldCheck className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
                  <span className="ms-3 text-sm text-gray-700">
                    <strong className="font-semibold text-indigo-900">
                      {t('content.shipping.addressChanges', 'Address Changes')}:
                    </strong>{' '}
                    {t('content.shipping.addressChangesText', 'Once an order has been placed, the shipping address cannot be changed.')}
                  </span>
                </li>
                <li className="flex">
                  <ShieldCheck className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
                  <span className="ms-3 text-sm text-gray-700">
                    <strong className="font-semibold text-indigo-900">
                      {t('content.shipping.packageHandling', 'Package Handling')}:
                    </strong>{' '}
                    {t('content.shipping.packageHandlingText', 'All packages are handled with care and are insured against loss or damage during shipping.')}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Shipping FAQs */}
        <div className="mt-16">
          <h2
            className="text-2xl font-bold text-indigo-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('pages.shipping.faqsTitle')}
          </h2>
          <div className="mt-6">
            <dl className="divide-y divide-amber-100">
              {shippingFaqs.map((faq) => (
                <div key={faq.question} className="py-6 md:grid md:grid-cols-12 md:gap-8">
                  <dt className="text-sm font-semibold text-indigo-900 md:col-span-5">{faq.question}</dt>
                  <dd className="mt-2 md:mt-0 md:col-span-7">
                    <p className="text-sm text-gray-500">{faq.answer}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-16 rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <div className="max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3
                    className="text-xl font-bold text-indigo-900"
                    style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                  >
                    {t('pages.shipping.needHelp')}
                  </h3>
                  <p className="mt-3 text-sm text-gray-600">
                    {t('pages.shipping.helpText')}
                  </p>
                </div>
                <div className="flex md:justify-end">
                  <a
                    href="/contact"
                    className="inline-flex w-full md:w-auto items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
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
