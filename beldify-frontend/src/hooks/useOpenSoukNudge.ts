'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseOpenSoukNudgeOptions {
  /**
   * Page-type key used to gate re-showing within a session.
   * e.g. 'category', 'products'. The nudge shows at most once per
   * session per key so we never nag a browsing user.
   */
  storageKey: string;
  /** True when the current view returned zero products (highest-intent trigger). */
  emptyResults?: boolean;
  /**
   * Master switch — only arm the dwell/scroll/exit triggers once this is true
   * (typically after the page's data has finished loading).
   */
  enabled?: boolean;
  /** Dwell time (ms) before the "browsed a lot, found nothing" trigger. Default 40s. */
  dwellMs?: number;
  /** Scroll-depth ratio (0–1) that counts as "scrolled to the bottom". Default 0.7. */
  scrollRatio?: number;
}

/**
 * Decides when to surface the "Can't find it? Request it on OpenSouk" nudge.
 *
 * Three triggers, session-gated so it appears at most once per page-type:
 *   1. Empty results        → opens shortly after a zero-result view loads.
 *   2. Long dwell + deep scroll → user spent >dwellMs and scrolled past the grid
 *                                 without finding what they wanted.
 *   3. Exit intent (desktop) → cursor leaves toward the top chrome / address bar.
 */
export function useOpenSoukNudge({
  storageKey,
  emptyResults = false,
  enabled = true,
  dwellMs = 40000,
  scrollRatio = 0.7,
}: UseOpenSoukNudgeOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const shownRef = useRef(false);
  const sessionFlag = `osnudge:${storageKey}`;

  const alreadyShown = useCallback(() => {
    if (shownRef.current) return true;
    try {
      return sessionStorage.getItem(sessionFlag) === '1';
    } catch {
      return false;
    }
  }, [sessionFlag]);

  const open = useCallback(() => {
    if (alreadyShown()) return;
    shownRef.current = true;
    try {
      sessionStorage.setItem(sessionFlag, '1');
    } catch {
      /* sessionStorage unavailable (private mode) — fall back to in-memory ref */
    }
    setIsOpen(true);
  }, [alreadyShown, sessionFlag]);

  const close = useCallback(() => setIsOpen(false), []);

  // 1) Empty results — open shortly after the zero-result view settles.
  useEffect(() => {
    if (!enabled || !emptyResults) return;
    const id = setTimeout(open, 600);
    return () => clearTimeout(id);
  }, [enabled, emptyResults, open]);

  // 2) Long dwell + deep scroll (skipped when emptyResults already armed #1).
  useEffect(() => {
    if (!enabled || emptyResults) return;
    let dwellReached = false;
    const dwellTimer = setTimeout(() => {
      dwellReached = true;
    }, dwellMs);

    const onScroll = () => {
      if (!dwellReached) return;
      const viewportBottom = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight || 1;
      if (viewportBottom / docHeight >= scrollRatio) open();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(dwellTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [enabled, emptyResults, dwellMs, scrollRatio, open]);

  // 3) Exit intent — desktop only (cursor exits past the top edge).
  useEffect(() => {
    if (!enabled) return;
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) open();
    };
    document.addEventListener('mouseout', onMouseOut);
    return () => document.removeEventListener('mouseout', onMouseOut);
  }, [enabled, open]);

  return { isOpen, open, close };
}

export default useOpenSoukNudge;
