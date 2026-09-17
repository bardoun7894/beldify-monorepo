'use client';

import { useTranslation } from 'react-i18next';

interface ErrorMessageProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function ErrorMessage({ message, action }: ErrorMessageProps) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-amber-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('common.error', 'Error')}</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="inline-block bg-amber-500 text-amber-950 px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
