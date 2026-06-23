'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import logger from '@/utils/consoleLogger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    logger.error('[route-error]', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-canvas text-gray-900 flex flex-col">
      {/* Top decorative strip */}
      <div className="h-1.5 bg-gradient-to-r from-rose-700 via-amber-500 to-indigo-700" aria-hidden />

      {/* Main content — vertically centred */}
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg text-center">
          {/* Eyebrow */}
          <p className="text-xs uppercase tracking-[0.18em] text-rose-700 font-medium">
            {t('error.eyebrow', 'حدث خطأ')}
          </p>

          {/* Icon */}
          <div className="mt-6 mb-6 flex justify-center">
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 ring-1 ring-rose-100 shadow-atlas-sm">
              <AlertTriangle className="h-9 w-9 text-rose-700" strokeWidth={1.5} aria-hidden />
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('error.headline', 'حدث خطأ غير متوقع')}
          </h1>

          {/* Sub */}
          <p className="mt-4 text-base text-gray-600 leading-relaxed max-w-sm mx-auto">
            {t(
              'error.body',
              'عذراً، واجهنا مشكلة أثناء تحميل هذه الصفحة. يمكنك المحاولة مجدداً أو العودة إلى الصفحة الرئيسية.'
            )}
          </p>

          {/* Digest — dev aid */}
          {error.digest && (
            <p className="mt-3 font-mono text-[10px] tracking-[0.2em] uppercase text-gray-400">
              {t('error.digest', 'رمز الخطأ')}: {error.digest}
            </p>
          )}

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-atlas-sm transition hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/40 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              {t('error.retry', 'حاول مجدداً')}
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 ring-1 ring-amber-200 shadow-atlas-sm transition hover:bg-amber-50 hover:ring-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:ring-offset-2"
            >
              <Home className="h-4 w-4" aria-hidden />
              {t('error.goHome', 'الصفحة الرئيسية')}
            </Link>
          </div>

          {/* Support link */}
          <p className="mt-8 text-sm text-gray-500">
            {t('error.persistsPrefix', 'إذا استمرت المشكلة،')}{' '}
            <Link
              href="/contact"
              className="text-indigo-700 hover:text-indigo-900 underline-offset-4 hover:underline transition"
            >
              {t('error.contactUs', 'تواصل مع فريق الدعم')}
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom amber accent strip */}
      <div className="h-1 bg-amber-200/60" aria-hidden />
    </main>
  );
}
