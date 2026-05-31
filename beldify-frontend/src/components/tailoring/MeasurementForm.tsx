'use client';

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Save, Info, Ruler } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Unit = 'cm' | 'in';

interface MeasurementValues {
  chest: string;
  waist: string;
  hips: string;
  length: string;
  notes: string;
}

interface MeasurementField {
  key: keyof Omit<MeasurementValues, 'notes'>;
  labelKey: string;
  labelDefault: string;
  hintKey: string;
  hintDefault: string;
  exampleCm: string;
  exampleIn: string;
  diagramId: string;
}

// ─── Static data (hoisted outside component per vercel-react-best-practices) ──

const MEASUREMENT_FIELDS: MeasurementField[] = [
  {
    key: 'chest',
    labelKey: 'tailoring.measurements.chest',
    labelDefault: 'محيط الصدر',
    hintKey: 'tailoring.measurements.chestHint',
    hintDefault: 'قيسي حول الجزء الأكثر امتلاءً من الصدر.',
    exampleCm: '90',
    exampleIn: '35',
    diagramId: 'chest',
  },
  {
    key: 'waist',
    labelKey: 'tailoring.measurements.waist',
    labelDefault: 'محيط الخصر',
    hintKey: 'tailoring.measurements.waistHint',
    hintDefault: 'قيسي حول أضيق جزء من خصرك.',
    exampleCm: '70',
    exampleIn: '27',
    diagramId: 'waist',
  },
  {
    key: 'hips',
    labelKey: 'tailoring.measurements.hips',
    labelDefault: 'محيط الأرداف',
    hintKey: 'tailoring.measurements.hipsHint',
    hintDefault: 'قيسي حول الجزء الأكثر امتلاءً من الأرداف.',
    exampleCm: '100',
    exampleIn: '39',
    diagramId: 'hips',
  },
  {
    key: 'length',
    labelKey: 'tailoring.measurements.length',
    labelDefault: 'الطول الكلي',
    hintKey: 'tailoring.measurements.lengthHint',
    hintDefault: 'من أعلى الكتف إلى الطول المطلوب (مع الحذاء).',
    exampleCm: '140',
    exampleIn: '55',
    diagramId: 'length',
  },
];

// Diagram annotation nodes: position as percentage of the 3:4 illustration container
const DIAGRAM_NODES = [
  { id: 'chest', labelKey: 'tailoring.measurements.diagramChest', labelDefault: 'الصدر', topPct: 25 },
  { id: 'waist', labelKey: 'tailoring.measurements.diagramWaist', labelDefault: 'الخصر', topPct: 40 },
  { id: 'hips', labelKey: 'tailoring.measurements.diagramHips', labelDefault: 'الأرداف', topPct: 56 },
  { id: 'length', labelKey: 'tailoring.measurements.diagramLength', labelDefault: 'الطول', topPct: 75 },
];

// ─── MeasurementForm Component ────────────────────────────────────────────────

interface MeasurementFormProps {
  /** Called when the user clicks "Add to Cart". Receives current form values + unit. */
  onAddToCart?: (values: MeasurementValues, unit: Unit) => void;
  /** Called when the user clicks "Save Measurements". Receives current form values + unit. */
  onSave?: (values: MeasurementValues, unit: Unit) => void;
}

export default function MeasurementForm({ onAddToCart, onSave }: MeasurementFormProps) {
  const { t } = useTranslation();

  const [unit, setUnit] = useState<Unit>('cm');
  const [values, setValues] = useState<MeasurementValues>({
    chest: '',
    waist: '',
    hips: '',
    length: '',
    notes: '',
  });
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  // handleChange is stable per field key
  const handleChange = useCallback(
    (key: keyof MeasurementValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }));
    },
    []
  );

  const handleDiagramNodeClick = useCallback((fieldId: string) => {
    setHighlightedField(fieldId);
    // Focus the corresponding input
    const el = document.getElementById(`field-${fieldId}`);
    if (el) {
      const input = el.querySelector<HTMLInputElement>('input');
      input?.focus();
    }
    // Clear highlight after 1.5 s
    setTimeout(() => setHighlightedField(null), 1500);
  }, []);

  const handleAddToCart = useCallback(() => {
    onAddToCart?.(values, unit);
  }, [onAddToCart, values, unit]);

  const handleSave = useCallback(() => {
    onSave?.(values, unit);
  }, [onSave, values, unit]);

  const unitLabel = unit === 'cm'
    ? t('tailoring.measurements.unitCm', 'سم')
    : t('tailoring.measurements.unitIn', 'إنش');

  return (
    <div dir="rtl" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* ── Left (Guide) column — 5 cols on desktop, order-2 on mobile ── */}
      <aside className="lg:col-span-5 order-2 lg:order-1">
        <div className="bg-white rounded-2xl shadow-[0px_8px_30px_rgba(37,37,85,0.08)] p-6 h-full border border-amber-200/30 lg:sticky lg:top-32">
          <h2 className="text-xl font-bold text-indigo-900 mb-5 pb-4 border-b border-amber-100"
            style={{ fontFamily: '"IBM Plex Sans Arabic", ui-sans-serif, sans-serif' }}
          >
            {t('tailoring.measurements.guideTitle', 'دليل أخذ المقاسات')}
          </h2>

          {/* Illustration with interactive nodes */}
          <div className="relative w-full aspect-[3/4] bg-amber-50 rounded-xl overflow-hidden mb-5 border border-amber-200/30">
            {/* Placeholder gradient representing a kaftan silhouette */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(160deg, #fbf9f4 0%, #f0eee9 40%, #e4e2dd 100%)',
              }}
              aria-hidden
            />
            {/* Kaftan outline decoration */}
            <svg
              aria-hidden
              className="absolute inset-0 w-full h-full opacity-20"
              viewBox="0 0 200 267"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Simplified kaftan silhouette */}
              <path
                d="M70 10 Q100 0 130 10 L150 60 Q130 70 100 72 Q70 70 50 60 Z"
                stroke="#252555" strokeWidth="1.5" fill="none"
              />
              <path
                d="M50 60 L30 120 Q50 135 100 138 Q150 135 170 120 L150 60"
                stroke="#252555" strokeWidth="1.5" fill="none"
              />
              <path
                d="M30 120 Q40 180 45 267"
                stroke="#252555" strokeWidth="1.5" fill="none"
              />
              <path
                d="M170 120 Q160 180 155 267"
                stroke="#252555" strokeWidth="1.5" fill="none"
              />
            </svg>

            {/* Interactive measurement nodes */}
            {DIAGRAM_NODES.map((node) => (
              <button
                key={node.id}
                type="button"
                aria-label={t(`tailoring.measurements.diagram${node.id.charAt(0).toUpperCase() + node.id.slice(1)}`, node.labelDefault)}
                onClick={() => handleDiagramNodeClick(node.id)}
                className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-full cursor-pointer group focus:outline-none"
                style={{ top: `${node.topPct}%` }}
              >
                {/* Horizontal measurement line */}
                <div
                  className="h-px w-1/2 absolute z-10 transition-colors duration-200"
                  style={{ backgroundColor: '#fea619' }}
                  aria-hidden
                />
                {/* Central node dot */}
                <div
                  className="w-4 h-4 rounded-full z-20 border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-125 group-focus-visible:scale-125"
                  style={{ backgroundColor: '#fea619' }}
                  aria-hidden
                />
                {/* Label */}
                <span
                  className="absolute end-[8%] bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium text-indigo-900 shadow-sm select-none"
                  aria-hidden
                >
                  {t(node.labelKey, node.labelDefault)}
                </span>
              </button>
            ))}
          </div>

          {/* Info callout */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-indigo-700 mt-0.5 flex-shrink-0" aria-hidden />
              <p className="text-sm text-indigo-800 leading-relaxed">
                {t(
                  'tailoring.measurements.guideHint',
                  'استخدمي شريط قياس مرن. تأكدي من أن الشريط مستقيم وموازي للأرض عند أخذ المقاسات المحيطية.'
                )}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right (Form) column — 7 cols on desktop, order-1 on mobile ── */}
      <div className="lg:col-span-7 order-1 lg:order-2">
        <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(37,37,85,0.05)] p-6 lg:p-8 border border-amber-200/30">

          {/* Form header with unit toggle */}
          <div className="flex justify-between items-center mb-8 pb-5 border-b border-amber-100">
            <h2
              className="text-2xl font-bold text-indigo-900"
              style={{ fontFamily: '"IBM Plex Sans Arabic", ui-sans-serif, sans-serif' }}
            >
              {t('tailoring.measurements.formTitle', 'المقاسات الشخصية')}
            </h2>

            {/* Unit toggle */}
            <div
              role="group"
              aria-label={t('tailoring.measurements.unitToggleLabel', 'وحدة القياس')}
              className="flex bg-amber-50 rounded-lg p-1 border border-amber-200/50"
            >
              <button
                type="button"
                aria-pressed={unit === 'cm'}
                aria-label={t('tailoring.measurements.unitCmLabel', 'سنتيمتر')}
                onClick={() => setUnit('cm')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  unit === 'cm'
                    ? 'bg-white shadow-sm text-indigo-900'
                    : 'text-indigo-600 hover:text-indigo-900'
                }`}
              >
                {t('tailoring.measurements.unitCm', 'سم')}
              </button>
              <button
                type="button"
                aria-pressed={unit === 'in'}
                aria-label={t('tailoring.measurements.unitInLabel', 'إنش')}
                onClick={() => setUnit('in')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  unit === 'in'
                    ? 'bg-white shadow-sm text-indigo-900'
                    : 'text-indigo-600 hover:text-indigo-900'
                }`}
              >
                {t('tailoring.measurements.unitIn', 'إنش')}
              </button>
            </div>
          </div>

          {/* Measurement grid */}
          <form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {MEASUREMENT_FIELDS.map((field) => {
                const isHighlighted = highlightedField === field.diagramId;
                const placeholder = `${t('tailoring.measurements.eg', 'مثال')}: ${
                  unit === 'cm' ? field.exampleCm : field.exampleIn
                }`;
                return (
                  <div
                    key={field.key}
                    id={`field-${field.diagramId}`}
                    className={`transition-all duration-300 rounded-xl ${
                      isHighlighted ? 'bg-indigo-50/60 p-3 -m-3' : ''
                    }`}
                  >
                    <label
                      htmlFor={`input-${field.key}`}
                      className="block text-sm font-medium text-indigo-900 mb-1.5"
                    >
                      {t(field.labelKey, field.labelDefault)}
                    </label>
                    <div className="relative">
                      <input
                        id={`input-${field.key}`}
                        type="number"
                        min="0"
                        step="0.5"
                        value={values[field.key]}
                        onChange={handleChange(field.key)}
                        placeholder={placeholder}
                        className="w-full bg-white border border-amber-200/60 rounded-lg py-3 px-4 ps-16 text-right text-base text-indigo-900 placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
                        aria-describedby={`hint-${field.key}`}
                      />
                      {/* Unit label positioned on the left side (start in RTL) */}
                      <span
                        className="absolute start-0 top-0 bottom-0 flex items-center px-4 text-sm text-indigo-400 font-medium pointer-events-none border-e border-amber-200/60 bg-amber-50/40 rounded-s-lg"
                        aria-hidden
                      >
                        {unitLabel}
                      </span>
                    </div>
                    <p
                      id={`hint-${field.key}`}
                      className="mt-1.5 text-xs text-indigo-400 leading-relaxed"
                    >
                      {t(field.hintKey, field.hintDefault)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Notes textarea */}
            <div className="mt-6 pt-6 border-t border-amber-100">
              <label
                htmlFor="input-notes"
                className="block text-sm font-medium text-indigo-900 mb-1.5"
              >
                {t('tailoring.measurements.notes', 'ملاحظات إضافية')}
                <span className="ms-1.5 text-xs font-normal text-indigo-400">
                  ({t('tailoring.measurements.optional', 'اختياري')})
                </span>
              </label>
              <textarea
                id="input-notes"
                rows={3}
                value={values.notes}
                onChange={handleChange('notes')}
                placeholder={t(
                  'tailoring.measurements.notesPlaceholder',
                  'هل هناك تفضيلات معينة بخصوص القصة أو المقاس؟'
                )}
                className="w-full bg-white border border-amber-200/60 rounded-lg py-3 px-4 text-right text-base text-indigo-900 placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-5 border-t border-amber-100">
              {/* Primary: Add to Cart — amber with dark text for WCAG AA contrast */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-gray-900 font-semibold py-4 px-6 rounded-xl shadow-sm transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                aria-label={t('tailoring.measurements.addToCart', 'إضافة إلى السلة')}
              >
                <ShoppingCart className="h-5 w-5 flex-shrink-0" aria-hidden />
                {t('tailoring.measurements.addToCart', 'إضافة إلى السلة')}
              </button>

              {/* Secondary: Save Measurements — outline indigo */}
              <button
                type="button"
                onClick={handleSave}
                className="sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-indigo-50 active:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold py-4 px-6 rounded-xl transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2"
                aria-label={t('tailoring.measurements.saveMeasurements', 'حفظ المقاسات')}
              >
                <Ruler className="h-5 w-5 flex-shrink-0" aria-hidden />
                {t('tailoring.measurements.saveMeasurements', 'حفظ المقاسات')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
