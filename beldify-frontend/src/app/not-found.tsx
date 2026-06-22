'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm ring-1 ring-amber-200 p-10 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-amber-600" aria-hidden>404</span>
        </div>
        <h2
          className="text-2xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          Page Not Found
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 transition-colors duration-200"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
