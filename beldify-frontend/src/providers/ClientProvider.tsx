'use client';

import { ReactNode, ErrorInfo, Component } from 'react';
import logger from '@/utils/consoleLogger';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { I18nProvider } from '@/providers/i18n-provider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { NavigationProvider } from '@/providers/NavigationProvider';
import RootLayoutClient from '@/app/layout-client';

// Dynamically import deferred providers wrapper to reduce initial bundle size
const DeferredProviders = dynamic(
  () => import('@/providers/DeferredProviders'),
  { ssr: false }
);

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error caught by ${this.props.name || 'error'} boundary:`, error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>Oops!</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', maxWidth: '400px' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.625rem 1.5rem',
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              style={{
                padding: '0.625rem 1.5rem',
                backgroundColor: '#ffffff',
                color: '#4b5563',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Go Home
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '1.5rem', textAlign: 'left', maxWidth: '600px', width: '100%' }}>
              <summary style={{ cursor: 'pointer', color: '#9ca3af', fontSize: '0.75rem' }}>
                Error details (dev only)
              </summary>
              <pre style={{
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: '#1f2937',
                color: '#fca5a5',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: '200px',
              }}>
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * A silent error boundary that renders children as-is on error.
 * Used for non-essential providers (messaging, chat, PWA) so their failure
 * doesn't take down the entire application.
 */
/**
 * A silent error boundary that renders a fallback when the wrapped component crashes.
 * Used for non-essential providers (messaging, chat, PWA) so their failure
 * doesn't take down the entire application.
 *
 * IMPORTANT: `fallback` should NOT include the crashing component — otherwise
 * React will just crash again in an infinite loop.
 */
class SilentErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; name: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.warn(`[${this.props.name}] Non-critical provider error (app continues):`, error.message);
  }

  render() {
    if (this.state.hasError) {
      // Render the fallback (which should be the children WITHOUT the crashed provider)
      // If no fallback given, render nothing for this subtree.
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

interface ClientProviderProps {
  children: ReactNode;
}

/**
 * Wraps non-critical providers so if they crash, the app still renders.
 * The fallback renders the content (RootLayoutClient + children) without
 * the messaging/chat providers — those features just become unavailable.
 */
export default function ClientProvider({ children }: ClientProviderProps) {
  const coreContent = <RootLayoutClient>{children}</RootLayoutClient>;

  return (
    <ErrorBoundary name="root">
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationProvider>
              <CartProvider>
                <WishlistProvider>
                  <SilentErrorBoundary name="DeferredProviders" fallback={coreContent}>
                    <DeferredProviders>
                      {coreContent}
                    </DeferredProviders>
                  </SilentErrorBoundary>
                </WishlistProvider>
              </CartProvider>
            </NavigationProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export { ErrorBoundary, SilentErrorBoundary };
