'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from '@/utils/toast';
import { FiBell, FiGlobe, FiMail } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import logger from '@/utils/consoleLogger';
export default function PreferencesSettings() {
  const { t } = useTranslation(['profile', 'common']);
  const { user, updatePreferences } = useAuth();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    email_notifications: user?.preferences?.email_notifications ?? true,
    marketing_emails: user?.preferences?.marketing_emails ?? false,
    order_updates: user?.preferences?.order_updates ?? true,
    newsletter: user?.preferences?.newsletter ?? false,
    language: user?.preferences?.language ?? 'en',
    timezone: user?.preferences?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const handleToggle = (name: string) => {
    setPreferences((prev) => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updatePreferences(preferences);
      toast.success(t('preferences.success_message'));
    } catch (error) {
      toast.error(t('preferences.error_message'));
      logger.error('Preferences update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Notification Settings */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <FiBell className="w-5 h-5 text-indigo-600" /> {/* Changed icon color */}
          <h3 className="text-lg font-medium">{t('preferences.notification_settings')}</h3>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200"> {/* Changed border color */}
          <div className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FiBell className="w-4 h-4 text-indigo-600" /> {/* Changed icon color */}
                <label className="font-medium">{t('preferences.email_notifications.title')}</label>
              </div>
              <p className="text-sm text-gray-500"> {/* Changed text color */}
                {t('preferences.email_notifications.description')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('email_notifications')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                preferences.email_notifications ? 'bg-amber-500' : 'bg-gray-200' // Inactive: gray, Active: amber
              }`}
            >
              <span
                className={`${
                  preferences.email_notifications ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200`}
              />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-indigo-600" /> {/* Changed icon color */}
                <label className="font-medium">{t('preferences.marketing_emails.title')}</label>
              </div>
              <p className="text-sm text-gray-500"> {/* Changed text color */}
                {t('preferences.marketing_emails.description')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('marketing_emails')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                preferences.marketing_emails ? 'bg-amber-500' : 'bg-gray-200' // Inactive: gray, Active: amber
              }`}
            >
              <span
                className={`${
                  preferences.marketing_emails ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200`}
              />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FiBell className="w-4 h-4 text-indigo-600" /> {/* Changed icon color */}
                <label className="font-medium">{t('preferences.order_updates.title')}</label>
              </div>
              <p className="text-sm text-gray-500">{t('preferences.order_updates.description')}</p> {/* Changed text color */}
            </div>
            <button
              type="button"
              onClick={() => handleToggle('order_updates')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                preferences.order_updates ? 'bg-amber-500' : 'bg-gray-200' // Inactive: gray, Active: amber
              }`}
            >
              <span
                className={`${
                  preferences.order_updates ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200`}
              />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-indigo-600" /> {/* Changed icon color */}
                <label className="font-medium">{t('preferences.newsletter.title')}</label>
              </div>
              <p className="text-sm text-gray-500">{t('preferences.newsletter.description')}</p> {/* Changed text color */}
            </div>
            <button
              type="button"
              onClick={() => handleToggle('newsletter')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                preferences.newsletter ? 'bg-amber-500' : 'bg-gray-200' // Inactive: gray, Active: amber
              }`}
            >
              <span
                className={`${
                  preferences.newsletter ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Language Settings */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <FiGlobe className="w-5 h-5 text-indigo-600" /> {/* Changed icon color */}
          <h3 className="text-lg font-medium">{t('preferences.language_settings')}</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="language" className="block text-sm font-medium text-gray-700">
              {t('preferences.language.title')}
            </label>
            <select
              id="language"
              name="language"
              value={preferences.language}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:text-sm"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="ma">الدارجة المغربية</option>
            </select>
            <p className="text-sm text-gray-500">{t('preferences.language.description')}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
              {t('preferences.timezone.title')}
            </label>
            <select
              id="timezone"
              name="timezone"
              value={preferences.timezone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:text-sm"
            >
              {Intl.supportedValuesOf('timeZone').map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500">{t('preferences.timezone.description')}</p>
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
          >
            {loading ? t('loading', { ns: 'common' }) : t('actions.save_changes', { ns: 'common' })}
          </button>
        </div>
      </div>
    </form>
  );
}
