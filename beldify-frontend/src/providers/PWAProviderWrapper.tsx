'use client';

import { EnhancedPWAProvider } from '@/contexts/EnhancedPWAContext';
import { SilentErrorBoundary } from '@/providers/ClientProvider';
import ModernInstallPrompt from '@/components/pwa/ModernInstallPrompt';
import PWAReminderBanner from '@/components/pwa/PWAReminderBanner';

/**
 * PWA UI is disabled by default. The auto-show install banner was covering the
 * hero on first paint and re-appearing on scroll. To re-enable it, append
 * `?pwa=install` to any URL — that opts the user into the modal explicitly.
 *
 * The EnhancedPWAProvider context is still mounted so other UI (e.g. an
 * "Install app" button in the footer) can call promptInstall() programmatically.
 */
export default function PWAProviderWrapper() {
  const showPwaUI =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('pwa') === 'install';

  return (
    <SilentErrorBoundary name="PWA">
      <EnhancedPWAProvider>
        {showPwaUI ? (
          <>
            <ModernInstallPrompt />
            <PWAReminderBanner />
          </>
        ) : null}
      </EnhancedPWAProvider>
    </SilentErrorBoundary>
  );
}
