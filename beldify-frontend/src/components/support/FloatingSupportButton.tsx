'use client';

import { useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+212708150351';
const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || SUPPORT_PHONE;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 1.99.522 3.859 1.438 5.476L2 22l4.644-1.418A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.182 8.182 0 01-4.184-1.148l-.3-.178-3.1.946.978-3.011-.197-.31A8.182 8.182 0 1112 20.182z" />
    </svg>
  );
}

export default function FloatingSupportButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const supportOptions = [
    {
      Icon: WhatsAppIcon,
      label: t('support.whatsapp', 'واتساب'),
      action: () => window.open(`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer'),
    },
    {
      Icon: PhoneIcon,
      label: t('support.call_us', 'اتصل بنا'),
      action: () => window.open(`tel:${SUPPORT_PHONE}`),
    },
    {
      Icon: EnvelopeIcon,
      label: t('support.email_us', 'راسلنا'),
      action: () => window.open('mailto:support@beldify.com'),
    },
  ];

  return (
    <div className="fixed right-6 z-50 bottom-[calc(4rem+1.5rem+env(safe-area-inset-bottom))] md:bottom-6">
      {/* Support Options */}
      {isOpen && (
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-2">
              <h3 className="text-white font-medium text-sm">{t('common.need_help', 'Need Help?')}</h3>
            </div>
            <div className="p-2">
              {supportOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={option.action}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition-colors"
                >
                  <option.Icon className="w-4 h-4 text-indigo-600" />
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