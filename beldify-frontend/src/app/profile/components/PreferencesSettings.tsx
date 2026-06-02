'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from '@/utils/toast';
import { Bell, Globe, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logger from '@/utils/consoleLogger';
import { Button } from '@/components/ui/button';

/** Reusable Atlas toggle row */
function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onToggle,
  id,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
          <Icon className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <label htmlFor={id} className="block text-sm font-medium text-indigo-900 cursor-pointer">
            {title}
          </label>
          <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Toggle — RTL-safe: track slides visually via flex direction which respects dir attribute */}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-1',
          checked ? 'bg-amber-500' : 'bg-gray-200',
        ].join(' ')}
      >
        <span
          className={[
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            // CSS transforms are NOT mirrored by dir=rtl, so the knob must be gated per
            // direction: slide +x in LTR, -x in RTL when checked.
            checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

/** Atlas-styled native select */
function AtlasSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <select
      {...rest}
      className={[
        'block w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-indigo-950',
        'focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700',
        'disabled:opacity-60 transition-colors duration-150',
        rest.className ?? '',
      ].join(' ')}
    >
      {children}
    </select>
  );
}

/** Section heading */
function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-amber-500" aria-hidden="true" />
      <h3 className="text-base font-semibold text-indigo-900">{label}</h3>
      <div className="flex-1 h-px bg-amber-100" />
    </div>
  );
}

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
    setPreferences((prev) => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
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
      {/* ── Notifications ── */}
      <section>
        <SectionHeading icon={Bell} label={t('preferences.notification_settings')} />
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 divide-y divide-amber-100 px-4">
          <ToggleRow
            id="pref-email-notifications"
            icon={Bell}
            title={t('preferences.email_notifications.title')}
            description={t('preferences.email_notifications.description')}
            checked={preferences.email_notifications}
            onToggle={() => handleToggle('email_notifications')}
          />
          <ToggleRow
            id="pref-marketing-emails"
            icon={Mail}
            title={t('preferences.marketing_emails.title')}
            description={t('preferences.marketing_emails.description')}
            checked={preferences.marketing_emails}
            onToggle={() => handleToggle('marketing_emails')}
          />
          <ToggleRow
            id="pref-order-updates"
            icon={Bell}
            title={t('preferences.order_updates.title')}
            description={t('preferences.order_updates.description')}
            checked={preferences.order_updates}
            onToggle={() => handleToggle('order_updates')}
          />
          <ToggleRow
            id="pref-newsletter"
            icon={Mail}
            title={t('preferences.newsletter.title')}
            description={t('preferences.newsletter.description')}
            checked={preferences.newsletter}
            onToggle={() => handleToggle('newsletter')}
          />
        </div>
      </section>

      {/* ── Language & Timezone ── */}
      <section>
        <SectionHeading icon={Globe} label={t('preferences.language_settings')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-indigo-900/80 mb-1.5">
              {t('preferences.language.title')}
            </label>
            <AtlasSelect id="language" name="language" value={preferences.language} onChange={handleChange}>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="ma">الدارجة المغربية</option>
            </AtlasSelect>
            <p className="mt-1.5 text-xs text-indigo-700">{t('preferences.language.description')}</p>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-indigo-900/80 mb-1.5">
              {t('preferences.timezone.title')}
            </label>
            <AtlasSelect id="timezone" name="timezone" value={preferences.timezone} onChange={handleChange}>
              {Intl.supportedValuesOf('timeZone').map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </AtlasSelect>
            <p className="mt-1.5 text-xs text-indigo-700">{t('preferences.timezone.description')}</p>
          </div>
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading} className="px-5">
          {loading ? t('common:loading') : t('common:actions.save_changes')}
        </Button>
      </div>
    </form>
  );
}
