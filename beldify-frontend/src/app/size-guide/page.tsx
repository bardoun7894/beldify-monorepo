'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  RectangleGroupIcon as GarmentIcon,
  Square2StackIcon as MeasureIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

type MeasurementType = 'men' | 'women' | 'kids';
type GarmentType = 'caftan' | 'jabador' | 'kandora';
type SizeSystem = 'ma' | 'eu' | 'uk' | 'us';

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
      const baseHeaders = [
        t('size_guide.measurements.ma_size'),
        measurementType === 'women'
          ? t('size_guide.measurements.bust')
          : t('size_guide.measurements.chest'),
        t('size_guide.measurements.waist'),
        t('size_guide.measurements.hip'),
        t('size_guide.measurements.length'),
      ];
      return baseHeaders;
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-indigo-900 dark:text-indigo-100 mb-4">
            {t('size_guide.title')}
          </h1>
          <p className="text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            {t('size_guide.description')}
          </p>
        </div>

        {/* Type Selectors */}
        <div className="space-y-8 mb-12">
          {/* Age Group Selector */}
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => setMeasurementType('women')}
              className={`flex items-center px-8 py-4 rounded-lg border-2 transition-all ${
                measurementType === 'women'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-300 text-gray-600 hover:border-indigo-300'
              }`}
            >
              <GarmentIcon className="h-6 w-6 mr-3" />
              <span className="text-lg font-medium">{t('size_guide.women')}</span>
            </button>
            <button
              onClick={() => setMeasurementType('men')}
              className={`flex items-center px-8 py-4 rounded-lg border-2 transition-all ${
                measurementType === 'men'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-300 text-gray-600 hover:border-indigo-300'
              }`}
            >
              <GarmentIcon className="h-6 w-6 mr-3" />
              <span className="text-lg font-medium">{t('size_guide.men')}</span>
            </button>
            <button
              onClick={() => setMeasurementType('kids')}
              className={`flex items-center px-8 py-4 rounded-lg border-2 transition-all ${
                measurementType === 'kids'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-300 text-gray-600 hover:border-indigo-300'
              }`}
            >
              <GarmentIcon className="h-6 w-6 mr-3" />
              <span className="text-lg font-medium">{t('size_guide.kids')}</span>
            </button>
          </div>

          {/* Garment Type Selector */}
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => setGarmentType('caftan')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                garmentType === 'caftan'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t('size_guide.garment_caftan')}
            </button>
            <button
              onClick={() => setGarmentType('jabador')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                garmentType === 'jabador'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t('size_guide.garment_jabador')}
            </button>
            <button
              onClick={() => setGarmentType('kandora')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                garmentType === 'kandora'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t('size_guide.garment_kandora')}
            </button>
          </div>
        </div>

        {/* Size Charts */}
        {garmentType === 'jabador' ? (
          <>
            {/* Jabador Top */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-8 overflow-hidden">
              <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-indigo-800 dark:text-indigo-200">
                  {t(`size_guide.${measurementType}_jabador_top`)}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {getMeasurementHeaders(measurementType, 'jabador').map((header, index) => (
                        <th
                          key={index}
                          className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {sizeCharts[measurementType].jabador.top.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Jabador Pants */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-12 overflow-hidden">
              <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-indigo-800 dark:text-indigo-200">
                  {t(`size_guide.${measurementType}_jabador_pants`)}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {getMeasurementHeaders(measurementType, 'jabador').map((header, index) => (
                        <th
                          key={index}
                          className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {sizeCharts[measurementType].jabador.pants.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : garmentType === 'kandora' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-12 overflow-hidden">
            <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-indigo-800 dark:text-indigo-200">
                {t(`size_guide.${measurementType}_kandora`)}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {getMeasurementHeaders(measurementType, 'kandora').map((header, index) => (
                      <th
                        key={index}
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {sizeCharts[measurementType].kandora.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : sizeCharts[measurementType]?.caftan ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-12 overflow-hidden">
            <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-indigo-800 dark:text-indigo-200">
                {measurementType === 'kids'
                  ? t('size_guide.kids_caftan')
                  : t('size_guide.garment_caftan')}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {getMeasurementHeaders(measurementType, 'caftan').map((header, index) => (
                      <th
                        key={index}
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {sizeCharts[measurementType].caftan.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">{t('size_guide.no_measurements')}</p>
          </div>
        )}
        {/* Measurement Instructions */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-indigo-800 dark:text-indigo-200">
              {t('size_guide.how_to_measure')}
            </h2>
            <div className="space-y-4">
              {/* Length Measurement */}
              <div className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <MeasureIcon className="h-6 w-6 text-indigo-600 mt-1 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {t('size_guide.length')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{t('size_guide.length_desc')}</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    * {measurementType === 'women' ? 'Caftan' : 'Jabador'} lengths range from 150cm
                    to 170cm
                  </p>
                </div>
              </div>
              {/* Other measurements... */}
            </div>
          </div>
          <div className="relative h-[400px] rounded-xl overflow-hidden">
            <Image
              src="/images/measurement-guide.jpg"
              alt="Measurement Guide"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
