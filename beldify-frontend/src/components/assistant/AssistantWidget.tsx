'use client';

/**
 * AssistantWidget — Darija Conversational Shopping Assistant (FR4)
 *
 * Architecture:
 *   - Launcher button (cheap, always rendered) — MessageSquare icon
 *   - Chat panel (lazy-loaded via next/dynamic on first open, ssr:false)
 *
 * Design: Atlas design system (indigo-700 primary / amber-500 accent)
 *         RTL-correct for ar/ma locales, honours prefers-reduced-motion
 * A11y:   aria-live="polite" on message list, ESC closes, focus trap on open
 * Links:  In-app PDP only — /products/{id} (FR5, no external/seller contact)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MessageSquare, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/hooks/useDirection';
import { cn } from '@/lib/utils';

// Lazy-load the heavy chat panel — launcher stays light
// ssr:false because it uses browser-only APIs (focus management, matchMedia)
const AssistantPanel = dynamic(
  () => import('./AssistantPanel').then((m) => ({ default: m.AssistantPanel })),
  { ssr: false }
);

// ─────────────────────────────────────────────────────────────────────────────

export function AssistantWidget() {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const [isOpen, setIsOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    // Return focus to launcher after close
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  // ESC key closes the panel
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  return (
    <>
      {/* ── Floating Launcher ──────────────────────────────────────────────── */}
      {!isOpen && (
        <button
          ref={launcherRef}
          onClick={open}
          aria-label={t('assistant.launcher_aria', 'Open shopping assistant')}
          className={cn(
            // Positioning — above FloatingSupportButton (bottom-20 sm:bottom-6)
            'fixed bottom-24 z-50',
            isRTL ? 'left-4' : 'right-4',
            // Pill shape with Atlas Indigo
            'flex items-center gap-2 px-4 py-3 rounded-full',
            'bg-indigo-700 text-white shadow-lg',
            'hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
            // Motion — skip when prefers-reduced-motion
            'transition-all duration-200 motion-reduce:transition-none',
            'hover:shadow-indigo-900/40 hover:shadow-xl'
          )}
        >
          <MessageSquare className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-wide">
            {t('assistant.launcher_label', 'Shop with AI')}
          </span>
        </button>
      )}

      {/* ── Chat Panel (lazy) ──────────────────────────────────────────────── */}
      {isOpen && (
        <AssistantPanel onClose={close} isRTL={isRTL} />
      )}
    </>
  );
}

export default AssistantWidget;
