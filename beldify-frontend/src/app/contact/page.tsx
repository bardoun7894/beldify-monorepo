'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import logger from '@/utils/consoleLogger';
import { contactService } from '@/services/contactService';

export default function ContactPage() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    setSubmitError('');
    setRateLimited(false);
    try {
      // Combine first + last name into the `name` field expected by the API
      const name = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
      await contactService.send({
        name: name || (data.name as string) || '',
        email: data.email as string,
        subject: (data.subject as string) || undefined,
        message: data.message as string,
      });
      logger.log('Contact form submitted successfully');
      setSubmitSuccess(true);
      reset();
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 6000);
    } catch (error: unknown) {
      logger.error('Error submitting contact form:', error);
      const message = error instanceof Error ? error.message : '';
      if (message === 'rate_limit') {
        setRateLimited(true);
      } else {
        setSubmitError(
          message ||
            t('contact.form.error', 'Something went wrong. Please try again or email us directly.')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactCards = [
    {
      icon: Mail,
      title: t('contact.cards.email.title', 'Email us'),
      detail: 'contact@beldify.com',
      sub: t('contact.cards.email.sub', 'We reply within 24 hours.'),
      href: 'mailto:contact@beldify.com',
    },
    {
      icon: Phone,
      title: t('contact.cards.phone.title', 'Call us'),
      detail: '+212 (0) 7 08 15 03 51',
      sub: t('contact.cards.phone.sub', 'Mon – Fri, 9 am – 6 pm (Morocco)'),
      href: 'tel:+212708150351',
    },
    {
      icon: MapPin,
      title: t('contact.cards.address.title', 'Visit us'),
      detail: t('contact.cards.address.detail', '123, Avenue de la Médina'),
      sub: t('contact.cards.address.sub', 'Tétouan, Morocco'),
      href: 'https://maps.google.com/?q=Tétouan,Morocco',
    },
  ];

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
            {t('contact.eyebrow', 'SAY HELLO')}
          </p>
          <h1
            className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('contact.headline', "We're here to help.")}
          </h1>
          <p className="mt-5 text-indigo-100 max-w-xl text-base sm:text-lg leading-relaxed">
            {t(
              'contact.sub',
              'Our team answers every message personally. Expect a reply within one business day.'
            )}
          </p>
        </div>
      </section>

      {/* 2-col grid: form + contact cards */}
      <section className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left: contact form */}
        <div>
          <h2
            className="text-2xl font-bold text-gray-900 mb-6"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('contact.form.heading', 'Send us a message')}
          </h2>

          {submitSuccess && (
            <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-gray-900 font-bold text-sm flex-shrink-0">
                ✓
              </span>
              <p className="text-sm font-medium text-amber-900">
                {t('contact.form.thankYou', "Thank you — we'll be in touch soon!")}
              </p>
            </div>
          )}

          {rateLimited && (
            <div
              role="alert"
              className="mb-6 rounded-2xl bg-amber-50 border border-amber-300 px-4 py-3 text-sm text-amber-800"
            >
              {t(
                'contact.form.rate_limited',
                "You've sent too many messages recently. Please wait a while before trying again."
              )}
            </div>
          )}

          {submitError && (
            <div
              role="alert"
              className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700"
            >
              {submitError}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('contact.form.firstName', 'First name')}
                </label>
                <input
                  {...register('firstName', {
                    required: t('contact.form.validation.firstNameRequired', 'First name is required'),
                  })}
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className="block w-full rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-rose-700">{errors.firstName.message as string}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('contact.form.lastName', 'Last name')}
                </label>
                <input
                  {...register('lastName', {
                    required: t('contact.form.validation.lastNameRequired', 'Last name is required'),
                  })}
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className="block w-full rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-rose-700">{errors.lastName.message as string}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('contact.form.email', 'Email address')}
              </label>
              <input
                {...register('email', {
                  required: t('contact.form.validation.emailRequired', 'Email is required'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('contact.form.validation.emailInvalid', 'Enter a valid email address'),
                  },
                })}
                id="email"
                type="email"
                autoComplete="email"
                className="block w-full rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-700">{errors.email.message as string}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('contact.form.phone', 'Phone (optional)')}
              </label>
              <input
                {...register('phone')}
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder={t('contact.form.phonePlaceholder')}
                className="block w-full rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('contact.form.subject', 'Subject')}
              </label>
              <input
                {...register('subject', {
                  required: t('contact.form.validation.subjectRequired', 'Subject is required'),
                })}
                id="subject"
                type="text"
                className="block w-full rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              {errors.subject && (
                <p className="mt-1 text-xs text-rose-700">{errors.subject.message as string}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  {t('contact.form.message', 'Message')}
                </label>
                <span className="text-xs text-gray-400">{t('contact.form.maxChars', 'max 500 chars')}</span>
              </div>
              <textarea
                {...register('message', {
                  required: t('contact.form.validation.messageRequired', 'Message is required'),
                  maxLength: {
                    value: 500,
                    message: t('contact.form.validation.messageTooLong', 'Message must be under 500 characters'),
                  },
                })}
                id="message"
                rows={5}
                className="block w-full rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
              />
              {errors.message && (
                <p className="mt-1 text-xs text-rose-700">{errors.message.message as string}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
            >
              {isSubmitting
                ? t('contact.form.sending', 'Sending…')
                : t('contact.form.send', 'Send message')}
            </button>
          </form>
        </div>

        {/* Right: contact info cards */}
        <div className="flex flex-col gap-5 lg:pt-16">
          {contactCards.map(({ icon: Icon, title, detail, sub, href }) => (
            <a
              key={title}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group flex items-start gap-4 rounded-2xl bg-white px-5 py-5 ring-1 ring-amber-200/60 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 ring-1 ring-amber-200 text-amber-700 transition group-hover:bg-amber-200">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="mt-0.5 text-base font-medium text-indigo-700">{detail}</p>
                <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
