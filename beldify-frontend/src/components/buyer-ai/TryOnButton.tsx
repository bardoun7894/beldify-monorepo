'use client';

/**
 * TryOnButton — PDP "Try it on" entry chip
 *
 * Shown ONLY when:
 *   (a) product vertical is apparel (isJewelry === false)
 *   (b) GET /api/tryon/config returns { enabled: true }
 *
 * Paid mode: shows a subtle "1 credit" chip next to the label.
 * ANY error from the config fetch → hidden (never break the PDP).
 * Atlas styling: indigo secondary with sparkle/wand icon.
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wand2 } from 'lucide-react';
import { fetchTryonConfig, TryonConfig } from '@/services/tryonService';
import { cn } from '@/lib/utils';

interface TryOnButtonProps {
  /** True when the product is a jewelry vertical — hides the button */
  isJewelry: boolean;
  productId: string | number;
  onOpen: () => void;
  className?: string;
  /** Pre-fetched config from the parent PDP — skips the internal fetch so
   *  button and modal share one /api/tryon/config call. */
  config?: TryonConfig;
}

export function TryOnButton({
  isJewelry,
  productId: _productId,
  onOpen,
  className,
  config: externalConfig,
}: TryOnButtonProps) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<TryonConfig | null>(
    isJewelry ? { enabled: false } : externalConfig ?? null
  );

  useEffect(() => {
    if (isJewelry) {
      setConfig({ enabled: false });
      return;
    }
    if (externalConfig) {
      setConfig(externalConfig);
      return;
    }
    let cancelled = false;
    fetchTryonConfig()
      .then((cfg) => {
        if (!cancelled) setConfig(cfg);
      })
      .catch(() => {
        if (!cancelled) setConfig({ enabled: false });
      });
    return () => {
      cancelled = true;
    };
  }, [isJewelry, externalConfig]);

  // Not yet resolved or disabled
  if (!config?.enabled) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'inline-flex items-center gap-2 rounded-full',
        'bg-indigo-50 ring-1 ring-indigo-200 text-indigo-700',
        'px-4 py-2 text-sm font-semibold',
        'hover:bg-indigo-100 transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40',
        'rtl:flex-row-reverse',
        className
      )}
      aria-label={t('tryon.button_label', 'Try it on — virtual fitting')}
    >
      <Wand2 className="h-4 w-4 shrink-0" aria-hidden />
      <span>{t('tryon.button', 'Try it on')}</span>
      {config.paid && (
        <span
          data-testid="tryon-credit-chip"
          className={cn(
            'inline-flex items-center rounded-full',
            'bg-indigo-700/10 text-indigo-700',
            'px-1.5 py-0.5 text-[10px] font-semibold leading-none',
            'ring-1 ring-indigo-300/40',
            'ltr:ml-0.5 rtl:mr-0.5'
          )}
          aria-label={t('tryon.credit_hint', '1 credit per try')}
        >
          {t('tryon.credit_chip', '1 credit')}
        </span>
      )}
    </button>
  );
}
