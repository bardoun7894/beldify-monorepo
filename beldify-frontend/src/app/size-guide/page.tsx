'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { LayoutGrid, Layers } from 'lucide-react';
import Image from 'next/image';

type MeasurementType = 'men' | 'women' | 'kids';
type GarmentType = 'caftan' | 'jabador' | 'kandora';

export default function SizeGuidePage() {
  const { t } = useTranslation();
  const [measurementType, setMeasurementType] = useState<MeasurementType>('women');
  const [garmentType, setGarmentType] = useState<GarmentType>('caftan');

  const getMeasurementHeaders = (measurementType: MeasurementType, garmentType: GarmentType) => {
    if (measurementType === 'kids') {
      return [
        t('size_guide.measurements.age'),
        t('size_guide.measurements.height'),
        t('size_guide.measurements.chest'),
        t('size_guide.measurements.waist'),
        t('size_guide.measurements.length'),
      ];
    } else {
      return [
        t('size_guide.measurements.ma_size'),
        measurementType === 'women'
          ? t('size_guide.measurements.bust')
          : t('size_guide.measurements.chest'),
        t('size_guide.measurements.waist'),
        t('size_guide.measurements.hip'),
        t('size_guide.measurements.length'),
      ];
    }
  };

  const sizeCharts = {
    men: {
      jabador: {
        top: {
          headers: getMeasurementHeaders('men', 'jabador'),
          rows: [
            ['S', '96-101', '82-87', '44-45', '75-80'],
            ['M', '102-107', '88-93', '46-47', '80-85'],
            ['L', '108-113', '94-99', '48-49', '85-90'],
            ['XL', '114-119', '100-105', '50-51', '90-95'],
            ['2XL', '120-125', '106-111', '52-53', '95-100'],
          ],
        },
        pants: {
          headers: getMeasurementHeaders('men', 'jabador'),
          rows: [
            ['S', '82-87', '98-103', '76-78', '98-100'],
            ['M', '88-93', '104-109', '78-80', '100-102'],
            ['L', '94-99', '110-115', '80-82', '102-104'],
            ['XL', '100-105', '116-121', '82-84', '104-106'],
            ['2XL', '106-111', '122-127', '84-86', '106-108'],
          ],
        },
      },
      caftan: {
        headers: getMeasurementHeaders('men', 'caftan'),
        rows: [
          ['S', '96-101', '82-87', '98-103', '150-155'],
          ['M', '102-107', '88-93', '104-109', '155-160'],
          ['L', '108-113', '94-99', '110-115', '160-165'],
          ['XL', '114-119', '100-105', '116-121', '165-170'],
          ['2XL', '120-125', '106-111', '122-127', '170-175'],
        ],
      },
      kandora: {
        headers: getMeasurementHeaders('men', 'kandora'),
        rows: [
          ['S', '96-101', '82-87', '98-103', '130-135'],
          ['M', '102-107', '88-93', '104-109', '135-140'],
          ['L', '108-113', '94-99', '110-115', '140-145'],
          ['XL', '114-119', '100-105', '116-121', '145-150'],
          ['2XL', '120-125', '106-111', '122-127', '150-155'],
        ],
      },
    },
    women: {
      caftan: {
        headers: getMeasurementHeaders('women', 'caftan'),
        rows: [
          ['S', '84-89', '66-71', '92-97', '150-155'],
          ['M', '90-95', '72-77', '98-103', '155-160'],
          ['L', '96-101', '78-83', '104-109', '160-165'],
          ['XL', '102-107', '84-89', '110-115', '165-170'],
          ['2XL', '108-113', '90-95', '116-121', '170-175'],
        ],
      },
      jabador: {
        top: {
          headers: getMeasurementHeaders('women', 'jabador'),
          rows: [
            ['S', '84-89', '66-71', '38-39', '70-75'],
            ['M', '90-95', '72-77', '40-41', '75-80'],
            ['L', '96-101', '78-83', '42-43', '80-85'],
            ['XL', '102-107', '84-89', '44-45', '85-90'],
            ['2XL', '108-113', '90-95', '46-47', '90-95'],
          ],
        },
        pants: {
          headers: getMeasurementHeaders('women', 'jabador'),
          rows: [
            ['S', '66-71', '92-97', '70-72', '95-97'],
            ['M', '72-77', '98-103', '72-74', '97-99'],
            ['L', '78-83', '104-109', '74-76', '99-101'],
            ['XL', '84-89', '110-115', '76-78', '101-103'],
            ['2XL', '90-95', '116-121', '78-80', '103-105'],
          ],
        },
      },
      kandora: {
        headers: getMeasurementHeaders('women', 'kandora'),
        rows: [
          ['S', '84-89', '66-71', '92-97', '130-135'],
          ['M', '90-95', '72-77', '98-103', '135-140'],
          ['L', '96-101', '78-83', '104-109', '140-145'],
          ['XL', '102-107', '84-89', '110-115', '145-150'],
          ['2XL', '108-113', '90-95', '116-121', '150-155'],
        ],
      },
    },
    kids: {
      caftan: {
        headers: getMeasurementHeaders('kids', 'caftan'),
        rows: [
          ['4-5', '110', '58-60', '54-56', '85-90'],
          ['6-7', '120', '62-64', '58-60', '95-100'],
          ['8-9', '130', '66-68', '62-64', '105-110'],
          ['10-11', '140', '70-72', '66-68', '115-120'],
          ['12-13', '150', '74-76', '70-72', '125-130'],
        ],
      },
      jabador: {
        top: {
          headers: getMeasurementHeaders('kids', 'jabador'),
          rows: [
            ['4-5', '110', '58-60', '28-29', '45-50'],
            ['6-7', '120', '62-64', '30-31', '50-55'],
            ['8-9', '130', '66-68', '32-33', '55-60'],
            ['10-11', '140', '70-72', '34-35', '60-65'],
            ['12-13', '150', '74-76', '36-37', '65-70'],
          ],
        },
        pants: {
          headers: getMeasurementHeaders('kids', 'jabador'),
          rows: [
            ['4-5', '110', '54-56', '58-60', '60-65'],
            ['6-7', '120', '58-60', '62-64', '65-70'],
            ['8-9', '130', '62-64', '66-68', '70-75'],
            ['10-11', '140', '66-68', '70-72', '75-80'],
            ['12-13', '150', '70-72', '74-76', '80-85'],
          ],
        },
      },
      kandora: {
        headers: getMeasurementHeaders('kids', 'kandora'),
        rows: [
          ['4-5', '110', '58-60', '54-56', '80-85'],
          ['6-7', '120', '62-64', '58-60', '85-90'],
          ['8-9', '130', '66-68', '62-64', '90-95'],
          ['10-11', '140', '70-72', '66-68', '95-100'],
          ['12-13', '150', '74-76', '70-72', '100-105'],
        ],
      },
    },
  };

  const measurementTypes: { key: MeasurementType; label: string }[] = [
    { key: 'women', label: t('size_guide.women') },
    { key: 'men', label: t('size_guide.men') },
    { key: 'kids', label: t('size_guide.kids') },
  ];

  const garmentTypes: { key: GarmentType; label: string }[] = [
    { key: 'caftan', label: t('size_guide.garment_caftan') },
    { key: 'jabador', label: t('size_guide.garment_jabador') },
    { key: 'kandora', label: t('size_guide.garment_kandora') },
  ];

  const SizeTable = ({
    headers,
    rows,
    title,
  }: {
    headers: string[];
    rows: string[][];
    title: string;
  }) => (
    <div className="rounded-2xl ring-1 ring-amber-200/60 bg-white shadow-sm overflow-hidden mb-8">
      <div className="px-6 py-4 bg-indigo-50 border-b border-amber-100">
        <h2
          className="text-xl font-bold text-indigo-900"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          {title}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-amber-100">
          <thead className="bg-amber-50/50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wide"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-amber-50">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition hover:bg-amber-50/30">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                  >
                    {cellIndex === 0 ? (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200/60">
                        {cell}
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Atlas editorial hero strip */}
      <div className="relative bg-indigo-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 15%, #f59e0b 0, transparent 45%), radial-gradient(circle at 85% 60%, #6366f1 0, transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400 font-medium mb-3">
            {t('size_guide.title')}
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('size_guide.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-indigo-200">
            {t('size_guide.description')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Type Selectors */}
        <div className="space-y-6 mb-12">
          {/* Age Group Pills */}
          <div className="flex justify-center gap-3 flex-wrap">
            {measurementTypes.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMeasurementType(key)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition ${
                  measurementType === key
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'bg-white text-indigo-700 ring-1 ring-indigo-200 hover:ring-indigo-400'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Garment Type Pills */}
          <div className="flex justify-center gap-3 flex-wrap">
            {garmentTypes.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setGarmentType(key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition ${
                  garmentType === key
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:ring-amber-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Size Charts */}
        {garmentType === 'jabador' ? (
          <>
            <SizeTable
              title={t(`size_guide.${measurementType}_jabador_top`)}
              headers={getMeasurementHeaders(measurementType, 'jabador')}
              rows={sizeCharts[measurementType].jabador.top.rows}
            />
            <SizeTable
              title={t(`size_guide.${measurementType}_jabador_pants`)}
              headers={getMeasurementHeaders(measurementType, 'jabador')}
              rows={sizeCharts[measurementType].jabador.pants.rows}
            />
          </>
        ) : garmentType === 'kandora' ? (
          <SizeTable
            title={t(`size_guide.${measurementType}_kandora`)}
            headers={getMeasurementHeaders(measurementType, 'kandora')}
            rows={sizeCharts[measurementType].kandora.rows}
          />
        ) : sizeCharts[measurementType]?.caftan ? (
          <SizeTable
            title={
              measurementType === 'kids'
                ? t('size_guide.kids_caftan')
                : t('size_guide.garment_caftan')
            }
            headers={getMeasurementHeaders(measurementType, 'caftan')}
            rows={sizeCharts[measurementType].caftan.rows}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">{t('size_guide.no_measurements')}</p>
          </div>
        )}

        {/* Measurement Instructions */}
        <div className="grid md:grid-cols-2 gap-8 mt-12 mb-12">
          <div className="space-y-6">
            <h2
              className="text-2xl font-bold text-indigo-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('size_guide.how_to_measure')}
            </h2>
            <div className="space-y-4">
              {/* Length Measurement */}
              <div className="flex items-start p-5 rounded-2xl ring-1 ring-amber-200/60 bg-white shadow-sm">
                <Layers className="h-5 w-5 text-amber-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-indigo-900">
                    {t('size_guide.length')}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">{t('size_guide.length_desc')}</p>
                  <p className="text-xs text-amber-700 mt-2">
                    * {t('content.sizeGuide.lengthRange', {
                      garment: measurementType === 'women' ? 'Caftan' : 'Jabador',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative h-[400px] rounded-2xl overflow-hidden ring-1 ring-amber-200/60">
            <Image
              src="/images/measurement-guide.jpg"
              alt={t('content.sizeGuide.measurementGuideAlt', 'Measurement Guide')}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
