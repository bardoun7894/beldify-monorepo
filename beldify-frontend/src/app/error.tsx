'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import logger from '@/utils/consoleLogger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm ring-1 ring-amber-200 p-10 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl" aria-hidden>⚠️</span>
        </div>
        <h2
          className="text-2xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          We couldn&apos;t load this page. Please try again or return to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 transition-colors duration-200"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-medium text-indigo-700 bg-white ring-1 ring-indigo-200 hover:bg-indigo-50 transition-colors duration-200"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
