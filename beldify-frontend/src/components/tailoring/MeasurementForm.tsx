'use client';

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Info, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const PLAYFAIR = '"Playfair Display", ui-serif, Georgia, serif';

// ─── Static data (hoisted outside component per vercel-react-best-practices) ──

const MEASUREMENT_FIELDS: MeasurementField[] = [
  {
    key: 'chest',
    labelKey: 'tailoring.measurements.chest',
    labelDefault: 'Chest',
    hintKey: 'tailoring.measurements.chestHint',
    hintDefault: 'Measure around the fullest part of your chest.',
    exampleCm: '90',
    exampleIn: '35',
    diagramId: 'chest',
  },
  {
    key: 'waist',
    labelKey: 'tailoring.measurements.waist',
    labelDefault: 'Waist',
    hintKey: 'tailoring.measurements.waistHint',
    hintDefault: 'Measure around the narrowest part of your waist.',
    exampleCm: '70',
    exampleIn: '27',
    diagramId: 'waist',
  },
  {
    key: 'hips',
    labelKey: 'tailoring.measurements.hips',
    labelDefault: 'Hips',
    hintKey: 'tailoring.measurements.hipsHint',
    hintDefault: 'Measure around the fullest part of your hips.',
    exampleCm: '100',
    exampleIn: '39',
    diagramId: 'hips',
  },
  {
    key: 'length',
    labelKey: 'tailoring.measurements.length',
    labelDefault: 'Total length',
    hintKey: 'tailoring.measurements.lengthHint',
    hintDefault: 'From the top of the shoulder to the desired length (with shoes).',
    exampleCm: '140',
    exampleIn: '55',
    diagramId: 'length',
  },
];

// Diagram annotation nodes: position as percentage of the 3:4 illustration container
const DIAGRAM_NODES = [
  { id: 'chest', labelKey: 'tailoring.measurements.diagramChest', labelDefault: 'Chest', topPct: 25 },
  { id: 'waist', labelKey: 'tailoring.measurements.diagramWaist', labelDefault: 'Waist', topPct: 40 },
  { id: 'hips', labelKey: 'tailoring.measurements.diagramHips', labelDefault: 'Hips', topPct: 56 },
  { id: 'length', labelKey: 'tailoring.measurements.diagramLength', labelDefault: 'Length', topPct: 75 },
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
    ? t('tailoring.measurements.unitCm', 'cm')
    : t('tailoring.measurements.unitIn', 'in');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* ── Left (Guide) column — 5 cols on desktop, order-2 on mobile ── */}
      <aside className="lg:col-span-5 order-2 lg:order-1">
        <div className="bg-white rounded-2xl shadow-atlas-md p-6 h-full border border-gray-200 lg:sticky lg:top-32">
          <h2 className="text-xl font-bold text-indigo-950 mb-5 pb-4 border-b border-gray-100"
            style={{ fontFamily: PLAYFAIR }}
          >
            {t('tailoring.measurements.guideTitle', 'Measurement guide')}
          </h2>

          {/* Illustration with interactive nodes */}
          <div className="relative w-full aspect-[3/4] bg-amber-50 rounded-xl overflow-hidden mb-5 border border-amber-200">
            {/* Placeholder gradient representing a kaftan silhouette */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-gray-50 via-stone-100 to-stone-200"
              aria-hidden
            />
            {/* Kaftan outline decoration */}
            <svg
              aria-hidden
              className="absolute inset-0 w-full h-full opacity-20 stroke-indigo-950"
              viewBox="0 0 200 267"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Simplified kaftan silhouette */}
              <path
                d="M70 10 Q100 0 130 10 L150 60 Q130 70 100 72 Q70 70 50 60 Z"
                strokeWidth="1.5" fill="none"
              />
              <path
                d="M50 60 L30 120 Q50 135 100 138 Q150 135 170 120 L150 60"
                strokeWidth="1.5" fill="none"
              />
              <path
                d="M30 120 Q40 180 45 267"
                strokeWidth="1.5" fill="none"
              />
              <path
                d="M170 120 Q160 180 155 267"
                strokeWidth="1.5" fill="none"
              />
            </svg>

            {/* Interactive measurement nodes */}
            {DIAGRAM_NODES.map((node) => (
              <button
                key={node.id}
                type="button"
                aria-label={t(`tailoring.measurements.diagram${node.id.charAt(0).toUpperCase() + node.id.slice(1)}`, node.labelDefault)}
                onClick={() => handleDiagramNodeClick(node.id)}
                className="absolute inset-x-0 mx-auto flex items-center justify-center w-full cursor-pointer group focus:outline-none"
                style={{ top: `${node.topPct}%` }}
              >
                {/* Horizontal measurement line */}
                <div
                  className="h-px w-1/2 absolute z-10 bg-amber-500 transition-colors duration-200"
                  aria-hidden
                />
                {/* Central node dot */}
                <div
                  className="w-4 h-4 rounded-full z-20 bg-amber-500 border-2 border-white shadow-atlas-sm transition-transform duration-200 group-hover:scale-125 group-focus-visible:scale-125"
                  aria-hidden
                />
                {/* Label */}
                <span
                  className="absolute end-[8%] bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium text-indigo-950 shadow-atlas-sm select-none"
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
                  'Use a flexible tape measure. Keep the tape straight and parallel to the floor when taking circumference measurements.'
                )}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right (Form) column — 7 cols on desktop, order-1 on mobile ── */}
      <div className="lg:col-span-7 order-1 lg:order-2">
        <div className="bg-white rounded-2xl shadow-atlas-sm p-6 lg:p-8 border border-gray-200">

          {/* Form header with unit toggle */}
          <div className="flex justify-between items-center mb-8 pb-5 border-b border-gray-100">
            <h2
              className="text-2xl font-bold text-indigo-950"
              style={{ fontFamily: PLAYFAIR }}
            >
              {t('tailoring.measurements.formTitle', 'Your measurements')}
            </h2>

            {/* Unit toggle */}
            <div
              role="group"
              aria-label={t('tailoring.measurements.unitToggleLabel', 'Measurement unit')}
              className="flex bg-amber-50 rounded-lg p-1 border border-amber-200"
            >
              <button
                type="button"
                aria-pressed={unit === 'cm'}
                aria-label={t('tailoring.measurements.unitCmLabel', 'Centimeters')}
                onClick={() => setUnit('cm')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  unit === 'cm'
                    ? 'bg-white shadow-atlas-sm text-indigo-950'
                    : 'text-indigo-600 hover:text-indigo-900'
                }`}
              >
                {t('tailoring.measurements.unitCm', 'cm')}
              </button>
              <button
                type="button"
                aria-pressed={unit === 'in'}
                aria-label={t('tailoring.measurements.unitInLabel', 'Inches')}
                onClick={() => setUnit('in')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  unit === 'in'
                    ? 'bg-white shadow-atlas-sm text-indigo-950'
                    : 'text-indigo-600 hover:text-indigo-900'
                }`}
              >
                {t('tailoring.measurements.unitIn', 'in')}
              </button>
            </div>
          </div>

          {/* Measurement grid */}
          <form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {MEASUREMENT_FIELDS.map((field) => {
                const isHighlighted = highlightedField === field.diagramId;
                const placeholder = `${t('tailoring.measurements.eg', 'e.g.')} ${
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
                      className="block text-sm font-medium text-indigo-950 mb-1.5"
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
                        className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 ps-16 text-start text-base text-indigo-950 placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
                        aria-describedby={`hint-${field.key}`}
                      />
                      {/* Unit label pinned to the inline-start edge (logical, RTL-safe) */}
                      <span
                        className="absolute start-0 top-0 bottom-0 flex items-center px-4 text-sm text-indigo-600 font-medium pointer-events-none border-e border-gray-200 bg-gray-50 rounded-s-lg"
                        aria-hidden
                      >
                        {unitLabel}
                      </span>
                    </div>
                    <p
                      id={`hint-${field.key}`}
                      className="mt-1.5 text-xs text-indigo-600 leading-relaxed"
                    >
                      {t(field.hintKey, field.hintDefault)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Notes textarea */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <label
                htmlFor="input-notes"
                className="block text-sm font-medium text-indigo-950 mb-1.5"
              >
                {t('tailoring.measurements.notes', 'Additional notes')}
                <span className="ms-1.5 text-xs font-normal text-indigo-600">
                  ({t('tailoring.measurements.optional', 'optional')})
                </span>
              </label>
              <textarea
                id="input-notes"
                rows={3}
                value={values.notes}
                onChange={handleChange('notes')}
                placeholder={t(
                  'tailoring.measurements.notesPlaceholder',
                  'Any specific preferences about cut or fit?'
                )}
                className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-start text-base text-indigo-950 placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-5 border-t border-gray-100">
              {/* Primary: Add to Cart — Atlas accent (amber-500 / text-amber-950) */}
              <Button
                type="button"
                variant="accent"
                onClick={handleAddToCart}
                className="flex-1 py-4 px-6 rounded-xl"
                aria-label={t('tailoring.measurements.addToCart', 'Add to cart')}
              >
                <ShoppingCart className="h-5 w-5 flex-shrink-0 me-2" aria-hidden />
                {t('tailoring.measurements.addToCart', 'Add to cart')}
              </Button>

              {/* Secondary: Save Measurements — outline indigo */}
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                className="sm:flex-none py-4 px-6 rounded-xl"
                aria-label={t('tailoring.measurements.saveMeasurements', 'Save measurements')}
              >
                <Ruler className="h-5 w-5 flex-shrink-0 me-2" aria-hidden />
                {t('tailoring.measurements.saveMeasurements', 'Save measurements')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
