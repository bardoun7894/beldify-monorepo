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
    console.log('Subscribing email:', email);
    setEmail('');
  };

  return (
    <section className="py-16 sm:py-20 bg-amber-50/40">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
                {t('newsletter.eyebrow', 'Stay in the loop')}
              </span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('newsletter.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('newsletter.subtitle')}
            </p>
            <div className="w-16 h-px bg-amber-200 mx-auto mt-6"></div>
          </div>

          {/* Newsletter Form */}
          <form className="max-w-md mx-auto" onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletter.placeholder')}
                className="flex-1 rounded-2xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900"
                required
              />
              <button
                type="submit"
                className="bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-3 rounded-full font-semibold transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {t('newsletter.button')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
