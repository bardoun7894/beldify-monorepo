'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';

const faqGroups: { heading: string; key: string; faqs: { q: string; a: string }[] }[] = [
  {
    heading: 'Shipping',
    key: 'shipping',
    faqs: [
      {
        q: 'Does Beldify ship internationally?',
        a: 'Yes. Beldify ships to most countries worldwide. Shipping costs and delivery times vary by destination. Standard international delivery takes 7–14 business days.',
      },
      {
        q: 'What are the shipping options within Morocco?',
        a: 'We offer standard delivery (5–7 business days) and express delivery (2–3 business days) within Morocco. Orders over 500 MAD qualify for free standard shipping.',
      },
      {
        q: 'How do I track my order?',
        a: "Once your order ships, you'll receive a confirmation email with a tracking link. You can also check your order status in the Orders section of your account.",
      },
    ],
  },
  {
    heading: 'Returns',
    key: 'returns',
    faqs: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 14 days of delivery for unworn items in original condition with tags attached. Custom-made pieces cannot be returned unless there is a manufacturing defect.',
      },
      {
        q: 'How do I start a return?',
        a: 'Log in, go to Orders, select the relevant order and follow the return instructions. Our team will issue a return label or reimburse reasonable return shipping costs for defective items.',
      },
      {
        q: 'How long do refunds take?',
        a: 'We process refunds within 3–5 business days of receiving the return. Allow an additional 3–10 business days for your bank to reflect the credit.',
      },
    ],
  },
  {
    heading: 'Tailoring',
    key: 'tailoring',
    faqs: [
      {
        q: 'How does bespoke tailoring work on Beldify?',
        a: 'Browse verified tailors, select one, fill in our guided measurement form (or book a video call), and confirm your order. Expect delivery in 2–4 weeks.',
      },
      {
        q: 'Can I customise fabric, colour, or embroidery?',
        a: 'Yes. Each tailor page lists customisation options. Availability and pricing vary; most ateliers can accommodate fabric swaps and embroidery preferences.',
      },
      {
        q: 'What if the garment does not fit?',
        a: 'We offer one free alteration round on all bespoke orders. Contact us within 7 days of delivery and we will coordinate with the tailor.',
      },
    ],
  },
  {
    heading: 'Sellers',
    key: 'sellers',
    faqs: [
      {
        q: 'How do I become a seller on Beldify?',
        a: 'Apply at beldify.com/seller/register. We review each application for authenticity and craft quality, then onboard accepted sellers within 3–5 business days.',
      },
      {
        q: 'What commission does Beldify charge?',
        a: 'Commission ranges from 10% to 15% depending on product category. There are no listing fees, setup fees, or monthly subscriptions.',
      },
      {
        q: 'When do sellers get paid?',
        a: 'Payments are deposited bi-weekly after accounting for the 14-day return window. We support bank transfers and mobile money.',
      },
    ],
  },
  {
    heading: 'Account',
    key: 'account',
    faqs: [
      {
        q: 'Do I need an account to buy?',
        a: 'No — guest checkout is available. Creating an account gives you order history, faster checkout, saved addresses, and wishlist access.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'Visa, Mastercard, PayPal, Apple Pay, Google Pay, and bank transfer. Cash on delivery is available for certain areas within Morocco.',
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot password" on the login page. We will email you a reset link that is valid for 30 minutes.',
      },
    ],
  },
];

export default function FAQsPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-canvas text-gray-900">
      {/* Editorial hero strip — DESIGN.md §6.4 */}
      <section className="relative isolate overflow-hidden bg-indigo-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_15%_15%,_#f59e0b_0,_transparent_45%),radial-gradient(circle_at_85%_60%,_#6366f1_0,_transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-amber-300 font-medium">
            {t('faqs.eyebrow', 'HELP')}
          </p>
          <h1
            className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('faqs.headline', 'Frequently asked.')}
          </h1>
          <p className="mt-5 text-indigo-100 max-w-xl text-base sm:text-lg leading-relaxed">
            {t('faqs.sub', "Quick answers — or write us if you don't find yours.")}
          </p>
        </div>
      </section>

      {/* FAQ accordion sections */}
      <section className="mx-auto max-w-3xl px-6 py-16 space-y-12">
        {faqGroups.map(({ heading, key, faqs }) => (
          <div key={key}>
            <h2 className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium mb-5">
              {t(`faqs.groups.${key}`, heading)}
            </h2>
            <div className="space-y-2">
              {faqs.map(({ q, a }, index) => (
                <details
                  key={index}
                  className="group rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm overflow-hidden"
                >
                  <summary className="flex cursor-pointer select-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-gray-900 hover:bg-gray-50 transition list-none [&::-webkit-details-marker]:hidden">
                    <span>{t(`faqs.items.${key}.${index}.question`, q)}</span>
                    {/* chevron */}
                    <svg
                      className="h-5 w-5 shrink-0 text-amber-500 transition-transform duration-200 group-open:rotate-180"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 8l5 5 5-5" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 pt-1 text-sm leading-relaxed text-gray-600 border-t border-gray-100">
                    {t(`faqs.items.${key}.${index}.answer`, a)}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}

        {/* Still have questions */}
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-6 py-8 text-center">
          <h3
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('faqs.stillHaveQuestions', "Didn't find your answer?")}
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            {t('faqs.contactText', 'Our team is one message away.')}
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-indigo-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800"
          >
            {t('faqs.contactUs', 'Write to us')}
          </Link>
        </div>
      </section>
    </main>
  );
}
