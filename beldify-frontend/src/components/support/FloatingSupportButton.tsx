'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+212708150351';
const SUPPORT_WHATSAPP = SUPPORT_PHONE.replace(/[^0-9]/g, '');
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@beldify.com';

type SupportOption = {
  icon: typeof ChatBubbleLeftRightIcon;
  labelKey: string;
  labelFallback: string;
  href: string;
  external?: boolean;
};

export default function FloatingSupportButton() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ma';
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ESC closes the menu and click-outside dismiss
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen]);

  const supportOptions: SupportOption[] = [
    {
      icon: ChatBubbleLeftRightIcon,
      labelKey: 'common.whatsapp',
      labelFallback: 'WhatsApp',
      href: `https://wa.me/${SUPPORT_WHATSAPP}`,
      external: true,
    },
    {
      icon: PhoneIcon,
      labelKey: 'common.call_us',
      labelFallback: 'Call Us',
      href: `tel:${SUPPORT_PHONE}`,
    },
    {
      icon: EnvelopeIcon,
      labelKey: 'common.email',
      labelFallback: 'Email',
      href: `mailto:${SUPPORT_EMAIL}`,
    },
  ];

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 bottom-[calc(4rem+1.5rem+env(safe-area-inset-bottom))] md:bottom-6 ${
        isRTL ? 'left-6' : 'right-6'
      }`}
    >
      {/* Support Options */}
      {isOpen && (
        <div className="mb-4" role="dialog" aria-label={t('common.need_help', 'Need Help?')}>
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden min-w-[200px]">
            <div className="bg-indigo-600 px-4 py-2">
              <h3 className="text-white font-medium text-sm">{t('common.need_help', 'Need Help?')}</h3>
            </div>
            <div className="p-2">
              {supportOptions.map((option) => {
                const Icon = option.icon;
                const label = t(option.labelKey, option.labelFallback);
                return (
                  <a
                    key={option.labelKey}
                    href={option.href}
                    target={option.external ? '_blank' : undefined}
                    rel={option.external ? 'noopener noreferrer' : undefined}
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-indigo-600 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={
          isOpen
            ? t('common.close_support', 'Close support menu')
            : t('common.open_support', 'Open support menu')
        }
        aria-expanded={isOpen}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6 text-white" aria-hidden="true" />
        ) : (
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
