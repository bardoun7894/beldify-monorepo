'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import '@/i18n/config';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [mounted, setMounted] = useState(false);
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();

  useEffect(() => {
    const locale = searchParams?.get('locale');
    if (locale) {
      i18n.changeLanguage(locale);
    }
  }, [searchParams, i18n]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration issues
  if (!mounted) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail('');
  };

  return (
    <section className="py-16 sm:py-20 bg-amber-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" aria-hidden="true" />
              {t('newsletter.eyebrow', 'Stay in the loop')}
            </span>
          </div>

          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('newsletter.title')}
          </h2>
          <p className="text-base text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
            {t('newsletter.subtitle')}
          </p>

          {/* Newsletter Form */}
          <form className="max-w-md mx-auto" onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletter.placeholder')}
                className="flex-1 rounded-2xl px-4 py-3 border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-colors duration-200 shadow-sm"
                required
                aria-label={t('newsletter.placeholder')}
              />
              <button
                type="submit"
                className="bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2"
              >
                {t('newsletter.button')}
              </button>
            </div>
          </form>

          {/* Trust line */}
          <p className="mt-4 text-xs text-gray-400">
            {t('newsletter.privacy', 'No spam. Unsubscribe anytime.')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
