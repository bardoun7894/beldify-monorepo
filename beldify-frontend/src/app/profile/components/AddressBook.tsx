'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from '@/utils/toast';
import logger from '@/utils/consoleLogger';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { addressService, type SavedAddress } from '@/services/addressService';

// ── Shared input helper ──────────────────────────────────────────────────────
function AtlasInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-indigo-950',
        'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700',
        'disabled:opacity-60 transition-colors duration-150',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

function AtlasSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }
) {
  const { children, ...rest } = props;
  return (
    <div className="relative">
      <select
        {...rest}
        className={[
          'block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-indigo-950',
          'appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:border-indigo-700',
          'disabled:opacity-60 transition-colors duration-150 pe-9',
          rest.className ?? '',
        ].join(' ')}
      >
        {children}
      </select>
      <ChevronDown
        className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-indigo-900/80 mb-1.5">
      {children}
    </label>
  );
}

// ── COUNTRIES LIST (mirrors checkout page) ───────────────────────────────────
const COUNTRIES = [
  { code: 'MA', name: 'Morocco' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
];

// ── Address form shape ────────────────────────────────────────────────────────
interface AddressFormData {
  label: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

const EMPTY_FORM: AddressFormData = {
  label: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  apartment: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'MA',
};

function addressToForm(addr: SavedAddress): AddressFormData {
  return {
    label: addr.label ?? '',
    first_name: addr.first_name,
    last_name: addr.last_name,
    email: addr.email ?? '',
    phone: addr.phone ?? '',
    address: addr.address,
    apartment: addr.apartment ?? '',
    city: addr.city,
    state: addr.state ?? '',
    postal_code: addr.postal_code ?? '',
    country: addr.country,
  };
}

// ── AddressCard ──────────────────────────────────────────────────────────────
function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: SavedAddress;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
}) {
  const { t } = useTranslation(['profile', 'common']);

  return (
    <div
      className={[
        'relative rounded-2xl border p-5 transition-all duration-200',
        address.is_default
          ? 'border-indigo-300 bg-indigo-50/60 shadow-sm'
          : 'border-gray-200 bg-white hover:border-indigo-200',
      ].join(' ')}
      aria-label={
        address.label
          ? t('profile:address_book.address_labeled', { label: address.label })
          : t('profile:address_book.address_unnamed')
      }
    >
      {/* Default badge */}
      {address.is_default && (
        <span className="absolute top-3 end-3 inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          <Star className="w-3 h-3" aria-hidden="true" />
          {t('profile:address_book.default_badge', 'Default')}
        </span>
      )}

      {/* Address details */}
      <div className="flex items-start gap-3 mb-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 mt-0.5">
          <MapPin className="w-4 h-4 text-amber-600" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          {address.label && (
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
              {address.label}
            </p>
          )}
          <p className="text-sm font-medium text-indigo-950 truncate">
            {address.first_name} {address.last_name}
          </p>
          <p className="text-sm text-indigo-700 truncate">{address.address}</p>
          {address.apartment && (
            <p className="text-sm text-indigo-700 truncate">{address.apartment}</p>
          )}
          <p className="text-sm text-indigo-700 truncate">
            {[address.city, address.state, address.postal_code].filter(Boolean).join(', ')}
          </p>
          <p className="text-sm text-indigo-700">{address.country}</p>
          {address.phone && (
            <p className="text-xs text-indigo-500 mt-1">{address.phone}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onEdit(address.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
          aria-label={t('profile:address_book.edit_address', 'Edit address')}
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          {t('common:edit', 'Edit')}
        </button>

        {!address.is_default && (
          <button
            type="button"
            onClick={() => onSetDefault(address.id)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-700 border border-amber-200 hover:bg-amber-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            aria-label={t('profile:address_book.set_default', 'Set as default')}
          >
            <Star className="w-3.5 h-3.5" aria-hidden="true" />
            {t('profile:address_book.set_default', 'Set as default')}
          </button>
        )}

        <button
          type="button"
          onClick={() => onDelete(address.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400/40 ms-auto"
          aria-label={t('profile:address_book.delete_address', 'Delete address')}
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          {t('common:delete', 'Delete')}
        </button>
      </div>
    </div>
  );
}

// ── AddressForm modal ─────────────────────────────────────────────────────────
function AddressForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: AddressFormData;
  onSave: (data: AddressFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const { t } = useTranslation(['profile', 'common']);
  const [form, setForm] = useState<AddressFormData>(initial);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-form-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3
            id="address-form-title"
            className="text-lg font-bold text-indigo-900"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {initial.address
              ? t('profile:address_book.edit_heading', 'Edit address')
              : t('profile:address_book.add_heading', 'New address')}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
            aria-label={t('common:close', 'Close')}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Label */}
          <div>
            <FieldLabel htmlFor="addr-label">
              {t('profile:address_book.fields.label', 'Label')}{' '}
              <span className="text-gray-400 font-normal text-xs">
                ({t('common:optional', 'optional')})
              </span>
            </FieldLabel>
            <AtlasInput
              type="text"
              id="addr-label"
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder={t('profile:address_book.fields.label_placeholder', 'Home, Work…')}
            />
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="addr-first-name">
                {t('profile:fields.first_name', 'First name')}
              </FieldLabel>
              <AtlasInput
                type="text"
                id="addr-first-name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                autoComplete="given-name"
              />
            </div>
            <div>
              <FieldLabel htmlFor="addr-last-name">
                {t('profile:fields.last_name', 'Last name')}
              </FieldLabel>
              <AtlasInput
                type="text"
                id="addr-last-name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Phone + email row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="addr-phone">
                {t('profile:fields.phone', 'Phone')}
              </FieldLabel>
              <AtlasInput
                type="tel"
                id="addr-phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                placeholder="+212 6…"
              />
            </div>
            <div>
              <FieldLabel htmlFor="addr-email">
                {t('profile:fields.email', 'Email')}
              </FieldLabel>
              <AtlasInput
                type="email"
                id="addr-email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Street + apartment */}
          <div>
            <FieldLabel htmlFor="addr-address">
              {t('profile:address_book.fields.street', 'Street address')}
            </FieldLabel>
            <AtlasInput
              type="text"
              id="addr-address"
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              autoComplete="street-address"
              placeholder="123 Rue Mohammed V"
            />
          </div>
          <div>
            <FieldLabel htmlFor="addr-apartment">
              {t('profile:address_book.fields.apartment', 'Apartment, suite, etc.')}{' '}
              <span className="text-gray-400 font-normal text-xs">
                ({t('common:optional', 'optional')})
              </span>
            </FieldLabel>
            <AtlasInput
              type="text"
              id="addr-apartment"
              name="apartment"
              value={form.apartment}
              onChange={handleChange}
              autoComplete="address-line2"
              placeholder={t('checkout.address.apartment_placeholder', 'Apt 4B')}
            />
          </div>

          {/* City + state */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="addr-city">
                {t('profile:fields.city', 'City')}
              </FieldLabel>
              <AtlasInput
                type="text"
                id="addr-city"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                autoComplete="address-level2"
                placeholder={t('checkout.address.city_placeholder', 'Casablanca')}
              />
            </div>
            <div>
              <FieldLabel htmlFor="addr-state">
                {t('profile:fields.state', 'Region / State')}
              </FieldLabel>
              <AtlasInput
                type="text"
                id="addr-state"
                name="state"
                value={form.state}
                onChange={handleChange}
                autoComplete="address-level1"
              />
            </div>
          </div>

          {/* Postal code + country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="addr-postal">
                {t('profile:fields.postal_code', 'Postal code')}
              </FieldLabel>
              <AtlasInput
                type="text"
                id="addr-postal"
                name="postal_code"
                value={form.postal_code}
                onChange={handleChange}
                autoComplete="postal-code"
                placeholder="20000"
              />
            </div>
            <div>
              <FieldLabel htmlFor="addr-country">
                {t('profile:fields.country', 'Country')}
              </FieldLabel>
              <AtlasSelect
                id="addr-country"
                name="country"
                value={form.country}
                onChange={handleChange}
              >
                <option value="">{t('profile:fields.select_country', 'Select country')}</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </AtlasSelect>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
            >
              {t('common:cancel', 'Cancel')}
            </button>
            <Button type="submit" disabled={isSaving} className="px-5">
              {isSaving ? (
                <>
                  <svg className="animate-spin me-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('common:saving', 'Saving…')}
                </>
              ) : (
                <>
                  <Check className="me-1.5 w-4 h-4" aria-hidden="true" />
                  {t('common:save_changes', 'Save changes')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirmation dialog ────────────────────────────────────────────────
function DeleteConfirm({
  onConfirm,
  onCancel,
  isDeleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  const { t } = useTranslation(['profile', 'common']);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
      >
        <h3 id="delete-confirm-title" className="text-base font-bold text-indigo-900 mb-2">
          {t('profile:address_book.delete_confirm_title', 'Delete address?')}
        </h3>
        <p className="text-sm text-indigo-700 mb-5">
          {t('profile:address_book.delete_confirm_body', 'This address will be permanently removed.')}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
          >
            {t('common:cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400/50"
          >
            {isDeleting ? t('common:deleting', 'Deleting…') : t('common:delete', 'Delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main AddressBook component ────────────────────────────────────────────────
export default function AddressBook() {
  const { t } = useTranslation(['profile', 'common']);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formInitial, setFormInitial] = useState<AddressFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load addresses
  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await addressService.list();
      setAddresses(result);
    } catch {
      toast.error(t('profile:address_book.load_error', 'Could not load addresses'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAdd = () => {
    setEditingId(null);
    setFormInitial(EMPTY_FORM);
    setFormOpen(true);
  };

  const handleEdit = (id: number) => {
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;
    setEditingId(id);
    setFormInitial(addressToForm(addr));
    setFormOpen(true);
  };

  const handleSave = async (data: AddressFormData) => {
    if (isSaving) return;
    setIsSaving(true);

    // Optimistic update
    const optimisticAddresses = [...addresses];

    try {
      if (editingId !== null) {
        // Optimistic edit
        setAddresses((prev) =>
          prev.map((a) =>
            a.id === editingId ? { ...a, ...data } : a
          )
        );
        await addressService.update(editingId, data);
        toast.success(t('profile:address_book.update_success', 'Address updated'));
      } else {
        const created = await addressService.create(data);
        setAddresses((prev) => [...prev, created]);
        toast.success(t('profile:address_book.create_success', 'Address saved'));
      }
      setFormOpen(false);
      // Refresh from server to get canonical state
      await loadAddresses();
    } catch (err) {
      logger.error('AddressBook save error:', err);
      // Rollback optimistic update
      setAddresses(optimisticAddresses);
      toast.error(t('profile:address_book.save_error', 'Could not save address'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequest = (id: number) => {
    setDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (isDeleting || deleteId === null) return;
    setIsDeleting(true);

    // Optimistic removal
    const previous = [...addresses];
    setAddresses((prev) => prev.filter((a) => a.id !== deleteId));

    try {
      await addressService.remove(deleteId);
      toast.success(t('profile:address_book.delete_success', 'Address deleted'));
      setDeleteId(null);
    } catch (err) {
      logger.error('AddressBook delete error:', err);
      // Rollback
      setAddresses(previous);
      toast.error(t('profile:address_book.delete_error', 'Could not delete address'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    // Optimistic: mark local state immediately
    const previous = [...addresses];
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_default: a.id === id }))
    );

    try {
      await addressService.setDefault(id);
      toast.success(t('profile:address_book.default_success', 'Default address updated'));
    } catch (err) {
      logger.error('AddressBook setDefault error:', err);
      // Rollback
      setAddresses(previous);
      toast.error(t('profile:address_book.default_error', 'Could not update default'));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label={t('profile:address_book.loading', 'Loading addresses')}>
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-amber-50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-indigo-700">
          {addresses.length === 0
            ? t('profile:address_book.empty_hint', 'No saved addresses yet.')
            : t('profile:address_book.count', '{{count}} address(es) saved', {
                count: addresses.length,
              })}
        </p>
        <Button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm"
          aria-label={t('profile:address_book.add_new', 'Add new address')}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t('profile:address_book.add_new', 'Add address')}
        </Button>
      </div>

      {/* Address cards grid */}
      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-12 px-6 text-center">
          <MapPin className="w-10 h-10 text-amber-300 mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-indigo-900 mb-1">
            {t('profile:address_book.empty_title', 'No saved addresses')}
          </p>
          <p className="text-xs text-indigo-500 mb-4 max-w-xs">
            {t(
              'profile:address_book.empty_body',
              'Add an address to speed up checkout next time.'
            )}
          </p>
          <Button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {t('profile:address_book.add_new', 'Add address')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Add / Edit form modal */}
      {formOpen && (
        <AddressForm
          initial={formInitial}
          onSave={handleSave}
          onCancel={() => setFormOpen(false)}
          isSaving={isSaving}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteId !== null && (
        <DeleteConfirm
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteId(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
