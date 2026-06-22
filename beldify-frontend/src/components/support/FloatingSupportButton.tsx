'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import toast from '@/utils/toast';

export default function FloatingSupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('pointerdown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('pointerdown', handleClick);
    };
  }, [isOpen]);

  const supportOptions = [
    {
      icon: ChatBubbleLeftRightIcon,
      label: t('support.live_chat', 'Live Chat'),
      action: () => toast.success(t('support.live_chat_coming_soon', 'Live chat coming soon!'))
    },
    {
      icon: PhoneIcon,
      label: t('support.call_us', 'Call Us'),
      action: () => window.open('tel:+212708150351')
    },
    {
      icon: EnvelopeIcon,
      label: t('support.email_us', 'Email'),
      action: () => window.open('mailto:support@beldify.com')
    }
  ];

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50">
      {/* Support Options */}
      {isOpen && (
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-2">
              <h3 className="text-white font-medium text-sm">{t('support.need_help', 'Need Help?')}</h3>
            </div>
            <div className="p-2">
              {supportOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={option.action}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition-colors"
                >
                  <option.icon className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('support.need_help', 'Need Help?')}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6 text-white" />
        ) : (
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
