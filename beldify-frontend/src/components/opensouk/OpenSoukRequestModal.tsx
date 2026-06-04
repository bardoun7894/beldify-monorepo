'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Megaphone, HandCoins, CheckCircle2, Sparkles, ArrowRight, X } from 'lucide-react';
import { useDirection } from '@/hooks/useDirection';

interface OpenSoukRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Category / search term the user was browsing — shown as a hint. */
  categoryName?: string;
  /** Where the CTA lands. Defaults to the OpenSouk feed. */
  href?: string;
}

/**
 * "Can't find it? Request it on OpenSouk" nudge.
 * Surfaces the reverse-marketplace value prop at the moment a buyer fails to
 * find a product, and routes them to the OpenSouk feed to post a request.
 */
export default function OpenSoukRequestModal({
  isOpen,
  onClose,
  categoryName,
  href = '/community',
}: OpenSoukRequestModalProps) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();

  const steps = [
    { Icon: Megaphone, title: t('openSouk.flowPostTitle', 'Post your request'), body: t('openSouk.flowPostBody', '') },
    { Icon: HandCoins, title: t('openSouk.flowBidsTitle', 'Ateliers come to you'), body: t('openSouk.flowBidsBody', '') },
    { Icon: CheckCircle2, title: t('openSouk.flowChooseTitle', 'Choose & order'), body: t('openSouk.flowChooseBody', '') },
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose} dir={isRTL ? 'rtl' : 'ltr'}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 translate-y-6 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-6 sm:scale-95"
          >
            <Dialog.Panel className="relative w-full sm:max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
              {/* Close */}
              <button
                onClick={onClose}
                aria-label={t('common.close', 'Close')}
                className="absolute top-4 end-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-gray-500 ring-1 ring-gray-200 hover:bg-white hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>

              {/* Header band */}
              <div className="relative px-6 pt-7 pb-6 bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950 text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wide uppercase">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {t('openSouk.eyebrow', 'OPEN SOUK')}
                </span>
                <Dialog.Title className="mt-3 text-2xl font-bold leading-tight" style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}>
                  {t('openSouk.nudgeTitle', "Can't find what you're looking for?")}
                </Dialog.Title>
                {categoryName && (
                  <p className="mt-1 text-sm text-indigo-200">
                    {t('openSouk.nudgeCategoryHint', 'Looking for something in {{category}}?', { category: categoryName })}
                  </p>
                )}
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                <p className="text-sm leading-relaxed text-gray-600">
                  {t('openSouk.nudgeBody', "Don't settle for what's in stock. Post a request and let Morocco's ateliers make exactly what you want.")}
                </p>

                {/* 3-step flow */}
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {steps.map(({ Icon, title, body }, i) => (
                    <motion.div
                      key={title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      className="flex flex-col items-center text-center gap-2"
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-indigo-700 ring-1 ring-amber-200">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="text-[12px] font-semibold text-gray-900 leading-tight">{title}</span>
                      <span className="hidden sm:block text-[11px] text-gray-500 leading-snug">{body}</span>
                    </motion.div>
                  ))}
                </div>

                {/* AI translate chip */}
                <div className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-50/70 px-3 py-2 text-[12px] text-indigo-800 ring-1 ring-indigo-100">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>{t('openSouk.aiTranslateChip', 'AI translates your brief to AR · EN · FR')}</span>
                </div>

                {/* CTAs */}
                <div className="mt-6 flex flex-col gap-2.5">
                  <Link
                    href={href}
                    onClick={onClose}
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-atlas-sm hover:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/40 focus:ring-offset-2"
                  >
                    {t('openSouk.nudgeCta', 'Browse requests & post yours')}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    {t('openSouk.nudgeDismiss', 'Keep browsing')}
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
