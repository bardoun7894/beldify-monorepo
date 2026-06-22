'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from '@/utils/toast';
import { FiUser, FiMapPin, FiTruck } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import logger from '@/utils/consoleLogger';
export default function GeneralSettings() {
  const { t } = useTranslation(['profile', 'common']);
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name_en || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.contact_number || '',
    billing_address: user?.address_en || '',
    address: user?.address_en || '',
    shipping_address: user?.address_en || '',
    city: user?.city || '',
    state: user?.state || '',
    postal_code: user?.postal_code || '',
    country: user?.country || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData);
      toast.success(t('notifications.changes_saved', { ns: 'common' }));
    } catch (error) {
      toast.error(t('notifications.error_saving', { ns: 'common' }));
      logger.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('personal_info', { ns: 'profile' })}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              {t('fields.full_name', { ns: 'profile' })}
            </label>
            <input
              type="text"
              name="full_name"
              id="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-amber-500 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              {t('fields.username', { ns: 'profile' })}
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-amber-500 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t('fields.email', { ns: 'profile' })}
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-amber-500 focus:ring-amber-500 text-sm"
            />
            <p className="mt-2 text-sm text-gray-500">
              {t('fields.email_help', { ns: 'profile' })}
            </p>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              {t('fields.phone', { ns: 'profile' })}
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-amber-500 focus:ring-amber-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Billing Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('fields.billing_address', { ns: 'profile' })}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              {t('fields.address', { ns: 'profile' })}
            </label>
            <input
              type="text"
              name="address"
              id="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-amber-500 focus:ring-amber-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t('fields.shipping_info', { ns: 'profile' })}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <label htmlFor="shipping_address" className="block text-sm font-medium text-gray-700">
              {t('fields.shipping_address', { ns: 'profile' })}
            </label>
            <input
              type="text"
              name="shipping_address"
              id="shipping_address"
              value={formData.shipping_address}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-amber-500 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              {t('fields.city', { ns: 'profile' })}
            </label>
            <input
              type="text"
              name="city"
              id="city"
              value={formData.city}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-amber-500 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              {t('fields.state', { ns: 'profile' })}
            </label>
            <input
              type="text"
              name="state"
              id="state"
              value={formData.state}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-amber-500 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
              {t('fields.postal_code', { ns: 'profile' })}
            </label>
            <input
              type="text"
              name="postal_code"
              id="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-amber-500 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              {t('fields.country', { ns: 'profile' })}
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-amber-500 focus:ring-amber-500 text-sm"
            >
              <option value="">{t('fields.select_country', { ns: 'profile' })}</option>
              {/* Add country options here */}
            </select>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {loading ? t('common:actions.saving') : t('common:actions.save_changes')}
        </button>
      </div>
    </form>
  );
}
