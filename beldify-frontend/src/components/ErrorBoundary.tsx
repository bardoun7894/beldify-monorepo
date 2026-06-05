'use client';

import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import '@/i18n/config';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Add your error tracking service here
      // Example: Sentry.captureException(error);
    }
  }

  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const error = this.state.error ?? new Error('An unknown error occurred');

      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={error} retry={this.retry} />;
      }

      return <DefaultErrorFallback error={error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  const { t } = useTranslation('common');
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-rose-700" />
        </div>

        <h1
          className="text-2xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          {t('errors.boundary.title', 'Something went wrong')}
        </h1>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          {t('errors.boundary.body', 'We apologize for the inconvenience. Please try refreshing the page.')}
        </p>

        {isDevelopment && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
              {t('errors.boundary.devDetails', 'Error Details (Development)')}
            </summary>
            <div className="bg-gray-100 rounded-2xl p-3 text-xs font-mono text-gray-800 overflow-auto">
              <p><strong>{t('errors.boundary.errorLabel', 'Error:')}</strong> {error.message}</p>
              {error.stack && (
                <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
              )}
            </div>
          </details>
        )}

        <div className="flex gap-3">
          <button
            onClick={retry}
            className="flex-1 inline-flex justify-center items-center px-4 py-3 text-sm font-semibold rounded-2xl text-white bg-indigo-700 hover:bg-indigo-800 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            {t('errors.boundary.retry', 'Try Again')}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="flex-1 inline-flex justify-center items-center px-4 py-3 text-sm font-semibold rounded-2xl text-gray-900 bg-white ring-1 ring-gray-300 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t('errors.boundary.reload', 'Reload Page')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Specialized error boundaries
function APIErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  const { t } = useTranslation('common');
  return (
    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
      <div className="flex">
        <ExclamationTriangleIcon className="h-5 w-5 text-rose-700 mr-2 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-rose-800">
            {t('errors.api.title', 'Failed to load data')}
          </h3>
          <p className="text-sm text-rose-700 mt-1">
            {error.message || t('errors.api.fallback', 'An unexpected error occurred while fetching data.')}
          </p>
          <button
            onClick={retry}
            className="mt-2 text-sm font-semibold text-rose-800 hover:text-rose-900 underline"
          >
            {t('errors.api.retry', 'Try again')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function APIErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary fallback={APIErrorFallback}>{children}</ErrorBoundary>;
}

function ComponentErrorFallback({
  error,
  retry,
  componentName,
}: { error: Error; retry: () => void; componentName?: string }) {
  const { t } = useTranslation('common');
  return (
    <div className="p-4 text-center bg-amber-50/50 border border-amber-200 rounded-2xl">
      <ExclamationTriangleIcon className="h-8 w-8 text-amber-700 mx-auto mb-2" />
      <p className="text-sm text-gray-700 mb-2">
        {componentName
          ? t('errors.component.namedFailed', { name: componentName, defaultValue: 'The {{name}} component failed to load.' })
          : t('errors.component.failed', 'This component failed to load.')}
      </p>
      <button
        onClick={retry}
        className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 underline"
      >
        {t('errors.component.retry', 'Retry')}
      </button>
    </div>
  );
}

export function ComponentErrorBoundary({
  children,
  componentName,
}: { children: React.ReactNode; componentName?: string }) {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <ComponentErrorFallback error={error} retry={retry} componentName={componentName} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;