'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/**
 * Dialog / Sheet — dependency-free modal primitive.
 *
 * Built WITHOUT @radix-ui/react-dialog (not installed). Provides, by hand:
 *   - createPortal into document.body so the modal escapes overflow/stacking
 *     contexts and the backdrop covers the viewport.
 *   - Body scroll-lock while open (restores the prior overflow on close).
 *   - Escape-to-close via a document keydown listener.
 *   - Backdrop click-to-close (clicks inside the panel are ignored).
 *   - A lightweight focus-trap: focus moves into the panel on open, Tab/Shift+Tab
 *     cycle within the panel's focusable elements, and focus returns to the
 *     previously-focused element on close.
 *   - Accessibility: role="dialog", aria-modal="true", optional aria-labelledby.
 *
 * Two visual modes:
 *   variant="modal" (default) — centered panel, rounded-2xl.
 *   variant="sheet"            — edge-anchored sheet (side: bottom | right | left | top).
 *                                Defaults to a bottom sheet which is the mobile
 *                                "More" pattern used by the seller nav.
 */

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

type SheetSide = 'bottom' | 'top' | 'left' | 'right';

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  /** modal = centered card · sheet = edge-anchored panel */
  variant?: 'modal' | 'sheet';
  /** sheet anchor edge (only used when variant="sheet") */
  side?: SheetSide;
  /** id of the element labelling the dialog (sets aria-labelledby) */
  labelledBy?: string;
  /** extra classes for the panel */
  panelClassName?: string;
}

const sheetPosition: Record<SheetSide, string> = {
  bottom: 'items-end justify-center',
  top: 'items-start justify-center',
  left: 'items-stretch justify-start',
  right: 'items-stretch justify-end',
};

const sheetPanelShape: Record<SheetSide, string> = {
  bottom: 'w-full rounded-t-3xl',
  top: 'w-full rounded-b-3xl',
  left: 'h-full max-w-sm rounded-e-3xl',
  right: 'h-full max-w-sm rounded-s-3xl',
};

export function Dialog({
  open,
  onClose,
  variant = 'modal',
  side = 'bottom',
  labelledBy,
  panelClassName,
  className,
  children,
  ...rest
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = React.useState(false);

  // Portals require document.body — only available after mount (SSR-safe).
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll-lock — restore the prior value on close/unmount.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus management + Escape + Tab trap.
  // Depends on `mounted` so the focus call runs only after the portal (and
  // therefore panelRef) actually exists in the DOM — on first render `mounted`
  // is false and the portal returns null.
  React.useEffect(() => {
    if (!open || !mounted) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    // Move focus into the panel — first focusable child, else the panel itself.
    const panel = panelRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === panelRef.current);
      if (focusables.length === 0) {
        e.preventDefault();
        panelRef.current.focus();
        return;
      }
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Restore focus to whatever was focused before the dialog opened.
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose, mounted]);

  if (!open || !mounted) return null;

  const isSheet = variant === 'sheet';
  const overlayLayout = isSheet ? sheetPosition[side] : 'items-center justify-center p-4';

  return createPortal(
    <div
      className={cn('fixed inset-0 z-[80] flex', overlayLayout, className)}
      {...rest}
    >
      {/* Backdrop — click to dismiss */}
      <div
        data-testid="dialog-backdrop"
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          'relative bg-card text-card-foreground shadow-atlas-xl ring-1 ring-black/5 outline-none text-start',
          isSheet
            ? cn('max-h-[85vh] overflow-y-auto', sheetPanelShape[side])
            : 'w-full sm:max-w-md rounded-3xl',
          panelClassName
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export default Dialog;
