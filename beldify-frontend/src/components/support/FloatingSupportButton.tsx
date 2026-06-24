'use client';

/**
 * FloatingSupportButton — unified help launcher (single FAB, bottom-right).
 *
 * One round button replaces the previous two separate floating widgets
 * (the standalone "Shop with AI" pill + this support button). Tapping it
 * opens a small menu led by the AI shopping assistant, then Call/Email.
 *
 * - Stays on the physical right in both LTR and RTL (dir="ltr" on the
 *   positioning shell), while the menu's text honours the locale direction.
 * - The heavy AI chat panel is lazy-loaded on first open (ssr:false).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/hooks/useDirection';
import { useAiFeatures } from '@/hooks/useAiFeatures';

// Lazy-load the AI shopping assistant panel (heavy, browser-only) on first open.
const AssistantPanel = dynamic(
  () => import('@/components/assistant/AssistantPanel').then((m) => ({ default: m.AssistantPanel })),
  { ssr: false }
);

export default function FloatingSupportButton() {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const { buyer_assistant } = useAiFeatures();
  const [isOpen, setIsOpen] = useState(false); // contact menu
  const [assistantOpen, setAssistantOpen] = useState(false); // AI chat panel
  const fabRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const openAssistant = useCallback(() => {
    setIsOpen(false);
    setAssistantOpen(true);
  }, []);
  const closeAssistant = useCallback(() => {
    setAssistantOpen(false);
    requestAnimationFrame(() => fabRef.current?.focus());
  }, []);

  // ESC closes the contact menu
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeMenu]);

  return (
    <>
      {/* Positioning shell — pinned bottom-right in every locale. */}
      <div
        dir="ltr"
        className="fixed right-6 z-50 bottom-[calc(4rem+1.5rem+env(safe-area-inset-bottom))] md:bottom-6 flex flex-col items-end"
      >
        {/* Contact menu */}
        {isOpen && (
          <div className="mb-4 w-64" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-indigo-700 px-4 py-2.5">
                <h3 className="text-white font-semibold text-sm">
                  {t('common.need_help', 'Need Help?')}
                </h3>
              </div>
              <div className="p-2">
                {/* AI shopping assistant — primary action, only when feature is enabled */}
                {buyer_assistant && (
                  <>
                    <button
                      onClick={openAssistant}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 transition-colors"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-700 text-white flex-shrink-0">
                        <SparklesIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-semibold text-start">
                        {t('assistant.launcher_label', 'Shop with AI')}
                      </span>
                    </button>
                    <div className="my-1.5 border-t border-gray-100" />
                  </>
                )}

                {/* Call us */}
                <a
                  href="tel:+212XXXXXXXX"
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  <PhoneIcon className="h-5 w-5 text-indigo-700 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm">{t('common.call_us', 'Call us')}</span>
                </a>
                {/* Email */}
                <a
                  href="mailto:support@beldify.com"
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  <EnvelopeIcon className="h-5 w-5 text-indigo-700 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm">{t('common.email', 'Email')}</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Main FAB */}
        <button
          ref={fabRef}
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-label={t('common.need_help', 'Need Help?')}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
            isOpen ? 'bg-gray-700 hover:bg-gray-800' : 'bg-indigo-700 hover:bg-indigo-800'
          }`}
        >
          {isOpen ? (
            <XMarkIcon className="w-6 h-6 text-white" />
          ) : (
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* AI assistant chat panel (lazy, full overlay) */}
      {assistantOpen && <AssistantPanel onClose={closeAssistant} isRTL={isRTL} />}
    </>
  );
}
