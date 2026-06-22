'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import toast from '@/utils/toast';

const SUPPORT_PHONE_HREF = 'tel:+212708150351';
const SUPPORT_EMAIL_HREF = 'mailto:support@beldify.com';

export default function FloatingSupportButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  const supportOptions = [
    {
      icon: ChatBubbleLeftRightIcon,
      label: t('support.live_chat', 'Live Chat'),
      action: () => {
        toast.success(t('support.live_chat_coming_soon', 'Live chat is coming soon.'));
        close();
      }
    },
    {
      icon: PhoneIcon,
      label: t('support.call_us', 'Call Us'),
      action: () => {
        window.location.href = SUPPORT_PHONE_HREF;
        close();
      }
    },
    {
      icon: EnvelopeIcon,
      label: t('support.email', 'Email'),
      action: () => {
        window.location.href = SUPPORT_EMAIL_HREF;
        close();
      }
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Support Options */}
      {isOpen && (
        <div id="floating-support-panel" role="menu" className="mb-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-2">
              <h3 className="text-white font-medium text-sm">{t('support.need_help', 'Need Help?')}</h3>
            </div>
            <div className="p-2">
              {supportOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={option.action}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option.icon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="floating-support-panel"
        aria-label={
          isOpen
            ? t('support.close_support', 'Close support menu')
            : t('support.open_support', 'Open support menu')
        }
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
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
