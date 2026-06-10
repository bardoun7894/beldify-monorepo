'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { User, MapPin, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logger from '@/utils/consoleLogger';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** Shared Atlas-styled label */
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-indigo-900/80 mb-1.5">
      {children}
    </label>
  );
}

/**
 * Atlas-styled native select — kept as a native <select> on purpose: the form's
 * handleChange relies on the native onChange (e.target.name / e.target.value)
 * contract, which the shared Radix Select does not expose. Reusing the shared
 * Select here would rewrite the data flow, so we keep the native control.
 */
function AtlasSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <select
      {...rest}
      className={[
        'block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-indigo-950',
        'focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700',
        'disabled:opacity-60 transition-colors duration-150',
        rest.className ?? '',
      ].join(' ')}
    >
      {children}
    </select>
  );
}

/** Section heading with amber underline */
function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-amber-500" aria-hidden="true" />
      <h3 className="text-base font-semibold text-indigo-900">{label}</h3>
      <div className="flex-1 h-px bg-amber-100" />
    </div>
  );
}

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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      {/* ── Personal Information ── */}
      <section>
        <SectionHeading icon={User} label={t('personal_info', { ns: 'profile' })} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="full_name">{t('fields.full_name', { ns: 'profile' })}</FieldLabel>
            <Input
              type="text"
              name="full_name"
              id="full_name"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div>
            <FieldLabel htmlFor="username">{t('fields.username', { ns: 'profile' })}</FieldLabel>
            <Input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div>
            <FieldLabel htmlFor="email">{t('fields.email', { ns: 'profile' })}</FieldLabel>
            <Input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
            />
            <p className="mt-1.5 text-xs text-indigo-700">{t('fields.email_help', { ns: 'profile' })}</p>
          </div>

          <div>
            <FieldLabel htmlFor="phone">{t('fields.phone', { ns: 'profile' })}</FieldLabel>
            <Input
              type="tel"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      {/* ── Billing Address ── */}
      <section>
        <SectionHeading icon={MapPin} label={t('fields.billing_address', { ns: 'profile' })} />
        <div>
          <FieldLabel htmlFor="address">{t('fields.address', { ns: 'profile' })}</FieldLabel>
          <Input
            type="text"
            name="address"
            id="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
      </section>

      {/* ── Shipping Information ── */}
      <section>
        <SectionHeading icon={Truck} label={t('fields.shipping_info', { ns: 'profile' })} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <FieldLabel htmlFor="shipping_address">{t('fields.shipping_address', { ns: 'profile' })}</FieldLabel>
            <Input
              type="text"
              name="shipping_address"
              id="shipping_address"
              value={formData.shipping_address}
              onChange={handleChange}
            />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="city">{t('fields.city', { ns: 'profile' })}</FieldLabel>
            <Input
              type="text"
              name="city"
              id="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="state">{t('fields.state', { ns: 'profile' })}</FieldLabel>
            <Input
              type="text"
              name="state"
              id="state"
              value={formData.state}
              onChange={handleChange}
            />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="postal_code">{t('fields.postal_code', { ns: 'profile' })}</FieldLabel>
            <Input
              type="text"
              name="postal_code"
              id="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
            />
          </div>

          <div className="sm:col-span-3">
            <FieldLabel htmlFor="country">{t('fields.country', { ns: 'profile' })}</FieldLabel>
            <AtlasSelect
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
            >
              <option value="">{t('fields.select_country', { ns: 'profile' })}</option>
              <option value="MA">{t('countries.ma', 'Morocco')}</option>
              <option value="SA">{t('countries.sa', 'Saudi Arabia')}</option>
              <option value="AE">{t('countries.ae', 'United Arab Emirates')}</option>
              <option value="QA">{t('countries.qa', 'Qatar')}</option>
              <option value="KW">{t('countries.kw', 'Kuwait')}</option>
              <option value="BH">{t('countries.bh', 'Bahrain')}</option>
              <option value="OM">{t('countries.om', 'Oman')}</option>
            </AtlasSelect>
          </div>
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" disabled={loading} className="px-5">
          {loading ? (
            <>
              <svg className="animate-spin me-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('common:saving')}
            </>
          ) : (
            t('common:save_changes')
          )}
        </Button>
      </div>
    </form>
  );
}
