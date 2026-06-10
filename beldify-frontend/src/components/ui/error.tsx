import React from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-12">
      <p className="text-red-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-amber-500 text-amber-950 rounded-md hover:bg-amber-600"
        >
          {t('common.try_again', 'Try again')}
        </button>
      )}
    </div>
  );
}
