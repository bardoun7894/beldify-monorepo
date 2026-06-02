'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Home, Search, ArrowRight } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-amber-50/40 text-gray-900 flex flex-col">
      {/* Top decorative strip */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-700 via-amber-500 to-indigo-700" aria-hidden />

      {/* Main content — vertically centred */}
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg text-center">
          {/* Arabic eyebrow */}
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
            {t('notFound.eyebrow', 'خطأ 404')}
          </p>

          {/* Large editorial number */}
          <div
            aria-hidden
            className="mt-4 text-[9rem] sm:text-[12rem] font-bold leading-none tracking-tight text-indigo-900/8 select-none"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            404
          </div>

          {/* Icon */}
          <div className="-mt-8 mb-6 flex justify-center">
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 ring-1 ring-indigo-100 shadow-atlas-sm">
              <Search className="h-9 w-9 text-indigo-700" strokeWidth={1.5} aria-hidden />
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('notFound.headline', 'الصفحة غير موجودة')}
          </h1>

          {/* Sub */}
          <p className="mt-4 text-base text-gray-600 leading-relaxed max-w-sm mx-auto">
            {t(
              'notFound.body',
              'يبدو أن هذه الصفحة أُزيلت أو لم تكن موجودة من قبل. تحقق من الرابط أو عُد إلى الصفحة الرئيسية.'
            )}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-atlas-sm transition hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/40 focus:ring-offset-2"
            >
              <Home className="h-4 w-4" aria-hidden />
              {t('notFound.goHome', 'الصفحة الرئيسية')}
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 ring-1 ring-amber-200 shadow-atlas-sm transition hover:bg-amber-50 hover:ring-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:ring-offset-2"
            >
              {t('notFound.browseProducts', 'تصفح المنتجات')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </div>

          {/* Quick links */}
          <nav aria-label={t('notFound.quickLinksLabel', 'روابط سريعة')} className="mt-12">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-medium mb-4">
              {t('notFound.quickLinks', 'روابط سريعة')}
            </p>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {[
                { href: '/shops', label: t('notFound.links.shops', 'المتاجر') },
                { href: '/contact', label: t('notFound.links.contact', 'اتصل بنا') },
                { href: '/faqs', label: t('notFound.links.faqs', 'الأسئلة الشائعة') },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-indigo-700 hover:text-indigo-900 underline-offset-4 hover:underline transition"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom amber accent strip */}
      <div className="h-1 bg-amber-200/60" aria-hidden />
    </main>
  );
}
