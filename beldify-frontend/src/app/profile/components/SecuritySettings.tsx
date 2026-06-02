'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from '@/utils/toast';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logger from '@/utils/consoleLogger';
import { Button } from '@/components/ui/button';

/** Atlas-styled password input with show/hide toggle */
function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  helpText,
  required,
  minLength,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helpText?: string;
  required?: boolean;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-indigo-900/80 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          className="block w-full rounded-xl border border-amber-200 bg-white pe-11 ps-4 py-2.5 text-sm text-indigo-950 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700 transition-colors duration-150"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 end-0 flex items-center pe-3 text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {helpText && <p className="mt-1.5 text-xs text-indigo-700">{helpText}</p>}
    </div>
  );
}

export default function SecuritySettings() {
  const { t } = useTranslation('profile');
  const { updatePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('security.password_mismatch'));
      return;
    }
    setLoading(true);
    try {
      await updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success(t('security.success_message'));
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(t('security.error_message'));
      logger.error('Password update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {/* Section heading */}
      <div className="flex items-center gap-2 mb-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <Lock className="h-4 w-4 text-indigo-700" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-indigo-900">{t('security.change_password')}</h3>
          <div className="mt-0.5 h-0.5 w-12 rounded-full bg-amber-400" />
        </div>
      </div>

      {/* Security hint card */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-xs text-amber-900/80 leading-relaxed">
          {t('security.password_help')}
        </p>
      </div>

      <div className="space-y-4">
        <PasswordField
          id="currentPassword"
          name="currentPassword"
          label={t('security.current_password')}
          value={formData.currentPassword}
          onChange={handleChange}
          required
        />

        <PasswordField
          id="newPassword"
          name="newPassword"
          label={t('security.new_password')}
          value={formData.newPassword}
          onChange={handleChange}
          required
          minLength={8}
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label={t('security.confirm_password')}
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading} className="min-w-[140px] px-5">
          {loading ? (
            <>
              <svg className="animate-spin me-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('security.updating')}
            </>
          ) : (
            t('security.update_password')
          )}
        </Button>
      </div>
    </form>
  );
}
