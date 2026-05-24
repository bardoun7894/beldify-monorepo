import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="text-center py-12">
      <p className="text-red-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
