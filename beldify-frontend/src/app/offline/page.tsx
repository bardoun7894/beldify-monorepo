'use client';

import { useTranslation } from 'react-i18next';
import '@/i18n/config';

export default function Offline() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="max-w-md w-full text-center px-6">
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-amber-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
            />
          </svg>
          <h1
            className="text-3xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('offline.title', "You're Offline")}
          </h1>
          <p className="text-gray-600 leading-relaxed">
            {t('offline.body', "It looks like you've lost your internet connection. Don't worry, you can still browse some previously viewed content.")}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-700 text-white py-3 px-4 rounded-2xl font-semibold transition hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {t('offline.retry', 'Try Again')}
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full bg-white text-gray-900 py-3 px-4 rounded-2xl font-semibold ring-1 ring-gray-300 transition hover:bg-gray-50"
          >
            {t('offline.back', 'Go Back')}
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>{t('offline.footnote', "Once you're back online, all features will be available again.")}</p>
        </div>
      </div>
    </div>
  );
}
