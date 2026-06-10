'use client';

/**
 * T031 — Seller: vertical-aware product form
 *
 * Renders conditional fields driven by GET /api/v1/verticals/{slug}/config.
 * Field required-ness comes exclusively from field.required — no hardcoded names.
 * Fields with the same group are rendered together in a collapsible section.
 *
 * LIVE WIRING (WS-A): fetchVerticalConfig already points to USE_MOCK flag in verticalService.ts
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { fetchVerticalConfig, VerticalField, VerticalSlug } from '@/services/verticalService';
import { cn } from '@/lib/utils';

// ─── props ────────────────────────────────────────────────────────────────────

export interface VerticalProductFormProps {
  vertical: VerticalSlug;
  /** Current field values (key → raw string value) */
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  /** If true, form shows validation errors */
  showErrors?: boolean;
}

// ─── field renderer ───────────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
  showError,
  isRTL: _isRTL,
}: {
  field: VerticalField;
  value: string;
  onChange: (key: string, val: string) => void;
  showError: boolean;
  isRTL: boolean;
}) {
  const { t } = useTranslation();
  const hasError = showError && field.required && !value;
  const inputClass = cn(
    'w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
    hasError
      ? 'border-rose-400 ring-1 ring-rose-300'
      : 'border-gray-200 focus:border-indigo-400'
  );

  if (field.type === 'select' && field.options) {
    return (
      <select
        id={`field-${field.key}`}
        name={field.key}
        value={value}
        onChange={e => onChange(field.key, e.target.value)}
        required={field.required}
        className={inputClass}
        aria-invalid={hasError}
        aria-required={field.required}
      >
        <option value="">
          {t('customOrders.select_placeholder', 'Select…')}
        </option>
        {field.options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  const inputType =
    field.type === 'decimal' || field.type === 'integer' ? 'number' : 'text';

  return (
    <input
      id={`field-${field.key}`}
      name={field.key}
      type={inputType}
      value={value}
      onChange={e => onChange(field.key, e.target.value)}
      required={field.required}
      step={field.type === 'decimal' ? '0.01' : field.type === 'integer' ? '1' : undefined}
      min={field.type === 'decimal' || field.type === 'integer' ? '0' : undefined}
      placeholder={field.label}
      className={inputClass}
      aria-invalid={hasError}
      aria-required={field.required}
    />
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function VerticalProductForm({
  vertical,
  values,
  onChange,
  showErrors = false,
}: VerticalProductFormProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [fields, setFields] = useState<VerticalField[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    fetchVerticalConfig(vertical)
      .then(config => setFields(config.fields))
      .finally(() => setLoading(false));
  }, [vertical]);

  // Separate ungrouped fields from grouped ones
  const { ungroupedFields, groups } = useMemo(() => {
    const ungrouped: VerticalField[] = [];
    const grouped: Map<string, VerticalField[]> = new Map();

    for (const field of fields) {
      if (field.group === null) {
        ungrouped.push(field);
      } else {
        if (!grouped.has(field.group)) grouped.set(field.group, []);
        grouped.get(field.group)!.push(field);
      }
    }
    return { ungroupedFields: ungrouped, groups: grouped };
  }, [fields]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <span>{t('customOrders.loading_fields', 'Loading fields…')}</span>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-2">
        {t('customOrders.no_fields', 'No custom fields for this vertical.')}
      </p>
    );
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Ungrouped fields */}
      {ungroupedFields.map(field => (
        <div key={field.key} className="space-y-1.5">
          <label
            htmlFor={`field-${field.key}`}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
          >
            {field.label}
            {field.required && (
              <span className="text-rose-600 font-bold" aria-label="required">*</span>
            )}
            {!field.required && (
              <span className="text-[10px] text-gray-400 font-normal">
                {t('customOrders.optional', 'optional')}
              </span>
            )}
          </label>
          <FieldInput
            field={field}
            value={values[field.key] ?? ''}
            onChange={onChange}
            showError={showErrors}
            isRTL={isRTL}
          />
          {showErrors && field.required && !values[field.key] && (
            <p className="text-xs text-rose-600" role="alert">
              {t('customOrders.field_required', '{{label}} is required', { label: field.label })}
            </p>
          )}
        </div>
      ))}

      {/* Grouped fields (e.g. gemstone group) */}
      {Array.from(groups.entries()).map(([group, groupFields]) => {
        const isExpanded = expandedGroups.has(group);
        const hasValues = groupFields.some(f => values[f.key]);

        return (
          <div
            key={group}
            className="rounded-xl ring-1 ring-gray-200 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors text-sm font-medium text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
              aria-expanded={isExpanded}
              aria-controls={`group-${group}`}
            >
              <span className="capitalize">
                {group}
                {hasValues && (
                  <span className="ms-2 inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden />
                )}
              </span>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="text-[10px] uppercase tracking-wide">
                  {t('customOrders.optional', 'optional')}
                </span>
                {isExpanded
                  ? <ChevronUp className="h-4 w-4" aria-hidden />
                  : <ChevronDown className="h-4 w-4" aria-hidden />}
              </div>
            </button>

            {isExpanded && (
              <div id={`group-${group}`} className="p-4 space-y-3 bg-white">
                {groupFields.map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <label
                      htmlFor={`field-${field.key}`}
                      className="text-sm font-medium text-gray-700 flex items-center gap-1.5"
                    >
                      {field.label}
                      <span className="text-[10px] text-gray-400 font-normal">
                        {t('customOrders.optional', 'optional')}
                      </span>
                    </label>
                    <FieldInput
                      field={field}
                      value={values[field.key] ?? ''}
                      onChange={onChange}
                      showError={showErrors}
                      isRTL={isRTL}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
