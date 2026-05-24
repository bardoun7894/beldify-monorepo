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
    // Here you would typically handle the newsletter subscription
    console.log('Subscribing email:', email);
    setEmail('');
    // Add success message or notification here
  };

  return (
    <section className="py-8 md:py-10 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* New 2025 Header Design */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('newsletter.title').toUpperCase()}</span>
              <div className="w-8 h-px bg-gray-200"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
              {t('newsletter.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('newsletter.subtitle')}
            </p>
            <div className="w-16 h-px bg-blue-500 mx-auto mt-6"></div>
          </div>

          {/* Newsletter Form */}
          <form className="max-w-md mx-auto" onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletter.placeholder')}
                className="flex-1 rounded-xl px-4 py-3 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                required
              />
              <button
                type="submit"
                className="bg-[#7c75ea] hover:bg-[#6a63d8] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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
