'use client';

/**
 * T035 — Buyer: "Request custom piece" form
 *
 * Supports jewelry and apparel (menswear/womenswear) vertical variants.
 * Fields are driven by GET /api/v1/verticals/{slug}/config.
 * Material is the only required field for jewelry (field.required from config).
 *
 * LIVE WIRING (WS-A): submitCustomOrder in customOrderService.ts (USE_MOCK flag)
 *
 * Note: apparel field keys are provisional (verticalService.ts MOCK_APPAREL_CONFIG).
 * They will auto-update once WS-A delivers GET /api/v1/verticals/menswear/config.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Gem, Scissors, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { fetchVerticalConfig, VerticalField, VerticalSlug } from '@/services/verticalService';
import { submitCustomOrder } from '@/services/customOrderService';
import { cn } from '@/lib/utils';

const playfair = { fontFamily: '"Playfair Display", ui-serif, Georgia, serif' };

const VERTICAL_ICONS: Record<string, React.ReactNode> = {
  jewelry:    <Gem className="h-5 w-5" aria-hidden />,
  menswear:   <Scissors className="h-5 w-5" aria-hidden />,
  womenswear: <Scissors className="h-5 w-5" aria-hidden />,
  tailor:     <Scissors className="h-5 w-5" aria-hidden />,
};

const VERTICAL_LABEL_KEYS: Record<string, { key: string; fallback: string }> = {
  jewelry:    { key: 'seller.store_settings.verticals.jewelry',    fallback: 'Jewelry' },
  menswear:   { key: 'seller.store_settings.verticals.menswear',   fallback: "Men's Clothing" },
  womenswear: { key: 'seller.store_settings.verticals.womenswear', fallback: "Women's Clothing" },
  tailor:     { key: 'seller.store_settings.verticals.tailor',     fallback: 'Tailoring' },
};

export interface CustomOrderFormProps {
  storeId: number;
  storeName: string;
  vertical: VerticalSlug;
}

export default function CustomOrderForm({ storeId, storeName, vertical }: CustomOrderFormProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();

  const [fields, setFields] = useState<VerticalField[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Fetch vertical config on mount
  useEffect(() => {
    setLoadingFields(true);
    fetchVerticalConfig(vertical)
      .then(config => {
        setFields(config.fields);
        setValues({});
      })
      .finally(() => setLoadingFields(false));
  }, [vertical]);

  const verticalLabel = t(
    VERTICAL_LABEL_KEYS[vertical]?.key ?? `seller.store_settings.verticals.${vertical}`,
    VERTICAL_LABEL_KEYS[vertical]?.fallback ?? vertical
  );

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const requiredFields = fields.filter(f => f.required);
    return requiredFields.every(f => values[f.key]?.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      setShowErrors(true);
      return;
    }

    // Build spec — include only non-empty values, cast numeric types
    const spec: Record<string, string | number | null> = {};
    for (const field of fields) {
      const raw = values[field.key];
      if (raw && raw.trim()) {
        if (field.type === 'decimal') {
          spec[field.key] = parseFloat(raw);
        } else if (field.type === 'integer') {
          spec[field.key] = parseInt(raw);
        } else {
          spec[field.key] = raw.trim();
        }
      }
    }

    try {
      setSubmitting(true);
      const order = await submitCustomOrder({
        store_id: storeId,
        vertical,
        spec,
        notes: notes.trim() || undefined,
      });
      setOrderId(order.id);
      setSubmitted(true);
    } catch {
      setError(t('customOrders.error.submit', 'Failed to submit your request. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state ──
  if (submitted && orderId) {
    return (
      <div className="flex flex-col items-center gap-5 text-center py-10 px-6">
        <div className="h-16 w-16 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={isRTL ? undefined : playfair}>
            {t('customOrders.submitted_title', 'Request Submitted!')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('customOrders.submitted_desc', 'Your request #{{id}} is under review. The seller will contact you soon.', { id: orderId })}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => router.push(`/custom-orders/${orderId}`)}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          >
            {t('customOrders.track_order', 'Track Order')}
          </button>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center rounded-full bg-white ring-1 ring-gray-200 hover:ring-indigo-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          >
            {t('customOrders.go_back', 'Go Back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} dir={isRTL ? 'rtl' : 'ltr'} noValidate>
      {/* ── Vertical header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center shrink-0">
          {VERTICAL_ICONS[vertical] ?? <Gem className="h-5 w-5" aria-hidden />}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
            {t('customOrders.custom_order_eyebrow', 'Custom Order')} · {storeName}
          </p>
          <p className="text-sm font-semibold text-gray-900">{verticalLabel}</p>
        </div>
      </div>

      {/* ── Global error ── */}
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loadingFields && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-6">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>{t('customOrders.loading_fields', 'Loading fields…')}</span>
        </div>
      )}

      {/* ── Vertical fields ── */}
      {!loadingFields && fields.length > 0 && (
        <div className="space-y-4 mb-6">
          {fields.map(field => {
            const hasError = showErrors && field.required && !values[field.key]?.trim();
            const inputClass = cn(
              'w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
              hasError ? 'border-rose-400 ring-1 ring-rose-300' : 'border-gray-200 focus:border-indigo-400'
            );

            return (
              <div key={field.key} className="space-y-1.5">
                <label
                  htmlFor={`cf-${field.key}`}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
                >
                  {field.label}
                  {field.required
                    ? <span className="text-rose-600 font-bold" aria-label="required">*</span>
                    : <span className="text-[10px] text-gray-400 font-normal">{t('customOrders.optional', 'optional')}</span>}
                </label>

                {field.type === 'select' && field.options ? (
                  <select
                    id={`cf-${field.key}`}
                    name={field.key}
                    value={values[field.key] ?? ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    required={field.required}
                    className={inputClass}
                    aria-invalid={hasError}
                    aria-required={field.required || undefined}
                  >
                    <option value="">{t('customOrders.select_placeholder', 'Select…')}</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`cf-${field.key}`}
                    name={field.key}
                    type={field.type === 'decimal' || field.type === 'integer' ? 'number' : 'text'}
                    value={values[field.key] ?? ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    required={field.required}
                    step={field.type === 'decimal' ? '0.01' : field.type === 'integer' ? '1' : undefined}
                    min={field.type === 'decimal' || field.type === 'integer' ? '0' : undefined}
                    placeholder={field.label}
                    className={inputClass}
                    aria-invalid={hasError}
                    aria-required={field.required || undefined}
                  />
                )}

                {hasError && (
                  <p className="text-xs text-rose-600" role="alert">
                    {t('customOrders.field_required', '{{label}} is required', { label: field.label })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Notes ── */}
      <div className="space-y-1.5 mb-6">
        <label htmlFor="cf-notes" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          {t('customOrders.notes_label', 'Notes')}
          <span className="text-[10px] text-gray-400 font-normal">{t('customOrders.optional', 'optional')}</span>
        </label>
        <textarea
          id="cf-notes"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          maxLength={2000}
          placeholder={t('customOrders.notes_placeholder', 'Any additional details…')}
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white focus:border-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 resize-none"
        />
        <p className="text-[10px] text-gray-400 text-end">{notes.length}/2000</p>
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={submitting || loadingFields}
        className={cn(
          'w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
          submitting || loadingFields
            ? 'bg-indigo-400 text-white cursor-wait'
            : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm'
        )}
        aria-busy={submitting}
      >
        {submitting
          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          : <Send className="h-4 w-4" aria-hidden />}
        {submitting
          ? t('customOrders.sending', 'Sending…')
          : t('customOrders.send_request', 'Send Request')}
      </button>
    </form>
  );
}
