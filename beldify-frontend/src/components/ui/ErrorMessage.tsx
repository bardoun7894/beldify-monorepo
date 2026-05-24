import React from 'react';

interface ErrorMessageProps {
  message: string;
  retry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, retry }) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
      <div className="flex items-center">
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="block sm:inline">{message}</span>
      </div>
      
      {retry && (
        <div className="mt-3">
          <button
            onClick={retry}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
            type="button"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;
