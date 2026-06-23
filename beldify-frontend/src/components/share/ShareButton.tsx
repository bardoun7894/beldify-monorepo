'use client';

/**
 * ShareButton — spreads a Beldify link OUT to social (WhatsApp first), pulling
 * traffic back INTO the app. By design it only ever shares an in-app URL; it
 * never exposes a seller's phone/WhatsApp, so the transaction always closes
 * in-app and the marketplace commission is protected.
 * See docs/marketing/growth-plan-2026-06-05.md (anti-disintermediation rule).
 */

import { useState, useRef, useEffect, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import { Share2, Link2, Check, Facebook } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  /** Absolute or relative URL to share. Defaults to the current page URL. */
  url?: string;
  /** Short title of the thing being shared (product/shop name). */
  title?: string;
  /** Optional extra context (e.g. price). */
  text?: string;
  /** 'button' = icon + label pill; 'icon' = compact icon-only. */
  variant?: 'button' | 'icon';
  className?: string;
  /** Override the visible label on the 'button' variant. */
  label?: string;
  /** Stretch the trigger to fill its container (e.g. full-width PDP CTA). */
  block?: boolean;
}

/** WhatsApp brand glyph (lucide has no brand icons). */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.039zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z" />
    </svg>
  );
}

export default function ShareButton({
  url,
  title,
  text,
  variant = 'button',
  className,
  label,
  block = false,
}: ShareButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve to an absolute URL so it works when pasted anywhere.
  const resolveUrl = () => {
    if (typeof window === 'undefined') return url || '';
    if (!url) return window.location.href;
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  };

  const shareUrl = resolveUrl();
  const headline = [title, text].filter(Boolean).join(' — ');
  const message = [headline, shareUrl].filter(Boolean).join('\n');

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleTrigger = async (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Native share sheet (mobile) — the ideal path for non-tech users.
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: title || undefined, text: headline || undefined, url: shareUrl });
        return;
      } catch (err) {
        // AbortError = user dismissed the sheet on purpose; don't pop the menu.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Any other failure → fall back to the manual menu.
      }
    }
    setOpen((v) => !v);
  };

  const copyLink = useCallback(async (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => {
        setCopied(false);
        copiedTimerRef.current = null;
      }, 2000);
    } catch {
      /* clipboard blocked — user can still use the WhatsApp/Facebook links */
    }
  }, [shareUrl]);

  const stop = (e: ReactMouseEvent) => e.stopPropagation();
  const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <div ref={ref} className={cn('relative', block ? 'block w-full' : 'inline-block', className)}>
      <button
        type="button"
        onClick={handleTrigger}
        aria-label={t('share.share', 'Share')}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
          variant === 'icon'
            ? 'h-10 w-10 bg-white ring-1 ring-gray-200 text-gray-700 hover:ring-indigo-300 hover:text-indigo-700'
            : 'px-4 py-3 text-sm bg-white ring-1 ring-gray-200 text-gray-700 hover:ring-indigo-300 hover:text-indigo-700',
          block && 'w-full'
        )}
      >
        <Share2 className={variant === 'icon' ? 'h-4 w-4' : 'h-4 w-4'} aria-hidden />
        {variant === 'button' && <span>{label || t('share.share', 'Share')}</span>}
      </button>

      {open && (
        <div
          role="menu"
          onClick={stop}
          className="absolute z-30 mt-2 w-52 rounded-2xl bg-white p-1.5 shadow-atlas-md ring-1 ring-gray-200 ltr:right-0 rtl:left-0"
        >
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={stop}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <WhatsAppGlyph className="h-5 w-5 text-emerald-500" />
            {t('share.whatsapp', 'WhatsApp')}
          </a>
          <a
            href={fbHref}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={stop}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
          >
            <Facebook className="h-5 w-5 text-blue-500" aria-hidden />
            {t('share.facebook', 'Facebook')}
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700"
          >
            {copied ? (
              <Check className="h-5 w-5 text-emerald-600" aria-hidden />
            ) : (
              <Link2 className="h-5 w-5 text-gray-400" aria-hidden />
            )}
            {copied ? t('share.copied', 'Link copied!') : t('share.copy_link', 'Copy link')}
          </button>
        </div>
      )}
    </div>
  );
}
