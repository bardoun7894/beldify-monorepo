'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+212708150351';
const SUPPORT_WHATSAPP = SUPPORT_PHONE.replace(/[^0-9]/g, '');
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@beldify.com';

export default function FloatingSupportButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const supportOptions = [
    {
      icon: ChatBubbleLeftRightIcon,
      label: t('common.whatsapp_chat', 'WhatsApp'),
      href: `https://wa.me/${SUPPORT_WHATSAPP}`,
      external: true,
    },
    {
      icon: PhoneIcon,
      label: t('common.call_us', 'Call Us'),
      href: `tel:${SUPPORT_PHONE}`,
      external: false,
    },
    {
      icon: EnvelopeIcon,
      label: t('common.email_us', 'Email'),
      href: `mailto:${SUPPORT_EMAIL}`,
      external: false,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed end-6 z-50 bottom-[calc(4rem+1.5rem+env(safe-area-inset-bottom))] md:bottom-6"
    >
      {/* Support Options */}
      {isOpen && (
        <div className="mb-4" role="menu" aria-label={t('common.need_help', 'Need Help?')}>
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-2">
              <h3 className="text-white font-medium text-sm">{t('common.need_help', 'Need Help?')}</h3>
            </div>
            <div className="p-2">
              {supportOptions.map((option) => (
                <a
                  key={option.href}
                  href={option.href}
                  role="menuitem"
                  target={option.external ? '_blank' : undefined}
                  rel={option.external ? 'noopener noreferrer' : undefined}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label={option.label}
                >
                  <option.icon className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        ref={toggleRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={
          isOpen
            ? t('common.support_toggle_close', 'Close support menu')
            : t('common.support_toggle_open', 'Open support menu')
        }
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
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
