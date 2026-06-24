'use client';

import { EnhancedPWAProvider } from '@/contexts/EnhancedPWAContext';
import { SilentErrorBoundary } from '@/providers/ClientProvider';
import ModernInstallPrompt from '@/components/pwa/ModernInstallPrompt';
import PWAReminderBanner from '@/components/pwa/PWAReminderBanner';

/**
 * PWA UI is mounted unconditionally so that the scoring engine in
 * EnhancedPWAContext can surface the install modal after meaningful
 * engagement events (post-purchase, checkout, cart threshold).
 *
 * Guards that REMAIN in place:
 *   - 24h dismiss guard (pwa-remind-later / installDismissed in context)
 *   - Adaptive threshold raise on repeated dismiss
 *   - isInstalled check (never prompt already-installed users)
 *   - Platform / browser support check
 *   - Scroll auto-show remains disabled in ModernInstallPrompt
 *
 * The ?pwa=install dev-gate was removed: it was gating a real re-engagement
 * channel with no production value (Hooked audit P0, 2026-06-19).
 */
export default function PWAProviderWrapper() {
  return (
    <SilentErrorBoundary name="PWA">
      <EnhancedPWAProvider>
        <ModernInstallPrompt />
        <PWAReminderBanner />
      </EnhancedPWAProvider>
    </SilentErrorBoundary>
  );
}
