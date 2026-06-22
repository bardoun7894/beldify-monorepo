'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import '@/i18n/config';
import toast from '@/utils/toast';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const localeParam = searchParams?.get('locale') ?? null;

  useEffect(() => {
    if (localeParam) {
      i18n.changeLanguage(localeParam);
    }
  }, [localeParam, i18n]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      toast.success(t('newsletter.success', 'Thank you! You\'ll hear from us soon.'));
      setEmail('');
    } catch {
      toast.error(t('newsletter.error', 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-2 h-2 bg-[hsl(var(--secondary))] rounded-full"></div>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--secondary))]">
                {t('newsletter.eyebrow', 'Stay in the loop')}
              </span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold text-[hsl(var(--primary))] mb-3 tracking-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('newsletter.title')}
            </h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              {t('newsletter.subtitle')}
            </p>
            <div className="w-16 h-px bg-atlas-secondary/[0.3] mx-auto mt-6"></div>
          </div>

          {/* Newsletter Form */}
          <form className="max-w-md mx-auto" onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="newsletter-email" className="sr-only">
                {t('newsletter.label', 'Email address')}
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletter.placeholder')}
                autoComplete="email"
                className="flex-1 rounded-xl px-4 py-3 border border-outline/30 focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all duration-200 text-foreground bg-card"
                required
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-[hsl(var(--primary))] hover:bg-primary-container text-white px-6 py-3 rounded-xl font-semibold transition-all duration-[220ms] ease-[cubic-bezier(0.33,1,0.68,1)] shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
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
