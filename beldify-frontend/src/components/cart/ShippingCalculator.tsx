'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, MapPin } from 'lucide-react';

interface ShippingCalculatorProps {
  subtotal: number;
  onCalculate?: (shipping: number) => void;
}

const CITIES = [
  { name: 'Casablanca', rate: 30 },
  { name: 'Rabat', rate: 35 },
  { name: 'Marrakech', rate: 40 },
  { name: 'Fes', rate: 45 },
  { name: 'Tangier', rate: 50 },
  { name: 'Agadir', rate: 55 },
  { name: 'Other', rate: 60 },
];

export default function ShippingCalculator({ subtotal, onCalculate }: ShippingCalculatorProps) {
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);

  const calculateShipping = () => {
    const city = CITIES.find(c => c.name === selectedCity);
    if (!city) return 0;
    // Free shipping for orders over 500
    if (subtotal >= 500) return 0;
    return city.rate;
  };

  const shipping = calculateShipping();

  const handleCalculate = () => {
    if (onCalculate) {
      onCalculate(shipping);
    }
  };

  if (!showCalculator) {
    return (
      <button
        onClick={() => setShowCalculator(true)}
        className="flex items-center gap-2 text-sm text-indigo-700 hover:text-indigo-800 font-medium transition-colors"
      >
        <Truck className="h-4 w-4" strokeWidth={1.5} />
        {t('cart.shipping.calculate')}
      </button>
    );
  }

  return (
    <div className="bg-amber-50 rounded-2xl p-4 ring-1 ring-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-indigo-700" strokeWidth={1.5} />
        <span className="text-sm font-medium text-gray-900">
          {t('cart.shipping.enter_location')}
        </span>
      </div>

      <select
        value={selectedCity}
        onChange={(e) => {
          setSelectedCity(e.target.value);
          handleCalculate();
        }}
        className="w-full rounded-2xl bg-white ring-1 ring-amber-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none px-3 py-2 mb-3"
      >
        <option value="">{t('cart.shipping.select_city')}</option>
        {CITIES.map((city) => (
          <option key={city.name} value={city.name}>
            {city.name} - {subtotal >= 500 ? t('cart.shipping.free', 'Free') : `${city.rate} MAD`}
          </option>
        ))}
      </select>

      {selectedCity && (
        <div className="text-sm">
          {subtotal >= 500 ? (
            <div className="flex items-center gap-2 text-amber-700">
              <Truck className="h-4 w-4" strokeWidth={1.5} />
              <span className="font-medium">{t('cart.shipping.free')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('cart.shipping.cost')}:</span>
              <span className="font-medium text-gray-900">{shipping} MAD</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setShowCalculator(false)}
        className="mt-3 text-xs text-gray-500 hover:text-gray-700"
      >
        {t('common.hide')}
      </button>
    </div>
  );
}
