/**
 * addressService — CRUD + set-default for saved addresses.
 *
 * All field names from the backend are isolated here.
 * If BE-3 ships different field names, update ONLY this file.
 *
 * Contracts (backend is being built in parallel):
 *   GET    /api/user/addresses          → {success,data:{addresses:[...]}}
 *   POST   /api/user/addresses          → {success,data:{address:{...}}}
 *   PUT    /api/user/addresses/{id}     → {success,data:{address:{...}}}
 *   DELETE /api/user/addresses/{id}     → {success}
 *   POST   /api/user/addresses/{id}/default → {success}
 *
 * Field-mapping assumptions (reconcile with BE-3 report):
 *   - id           → number
 *   - label        → string (e.g. "Home", "Work")
 *   - first_name / last_name → string
 *   - email        → string
 *   - phone        → string
 *   - address      → string (street line)
 *   - apartment    → string | undefined
 *   - city / state → string
 *   - postal_code  → string | undefined  (backend may send zip_code — handle both)
 *   - country      → ISO-2 string
 *   - is_default   → boolean
 */

import api from '@/lib/api';
import logger from '@/utils/consoleLogger';

export interface SavedAddress {
  id: number;
  label?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address: string;
  apartment?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_default?: boolean;
}

/** The shape that checkout's shippingInfo state expects */
export interface CheckoutShippingPrefill {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
}

type CreatePayload = Omit<SavedAddress, 'id' | 'is_default'> & { [k: string]: any };
type UpdatePayload = Partial<Omit<SavedAddress, 'id'>>;

function normaliseAddress(raw: any): SavedAddress {
  return {
    id: Number(raw.id),
    label: raw.label ?? undefined,
    first_name: String(raw.first_name ?? ''),
    last_name: String(raw.last_name ?? ''),
    email: raw.email ? String(raw.email) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    address: String(raw.address ?? ''),
    apartment: raw.apartment ?? undefined,
    city: String(raw.city ?? ''),
    // state may be absent on some backends
    state: raw.state ? String(raw.state) : undefined,
    // backend may call this postal_code or zip_code
    postal_code: String(raw.postal_code ?? raw.zip_code ?? ''),
    country: String(raw.country ?? ''),
    is_default: Boolean(raw.is_default),
  };
}

export const addressService = {
  /** Fetch all saved addresses for the authenticated user. */
  async list(): Promise<SavedAddress[]> {
    try {
      const response = await api.get('/api/user/addresses');
      const payload = response?.data;
      if (!payload?.success) return [];
      const addresses: any[] = payload?.data?.addresses ?? [];
      if (!Array.isArray(addresses)) return [];
      return addresses.map(normaliseAddress);
    } catch (error) {
      logger.error('addressService.list failed:', error);
      return [];
    }
  },

  /** Create a new saved address. Throws on failure (caller handles toast). */
  async create(payload: CreatePayload): Promise<SavedAddress> {
    const response = await api.post('/api/user/addresses', payload);
    const raw = response?.data?.data?.address;
    return normaliseAddress(raw);
  },

  /** Update an existing address. Throws on failure. */
  async update(id: number, payload: UpdatePayload): Promise<SavedAddress> {
    const response = await api.put(`/api/user/addresses/${id}`, payload);
    const raw = response?.data?.data?.address;
    return normaliseAddress(raw);
  },

  /** Delete an address. Throws on failure. */
  async remove(id: number): Promise<void> {
    await api.delete(`/api/user/addresses/${id}`);
  },

  /** Set an address as the default. Throws on failure. */
  async setDefault(id: number): Promise<void> {
    await api.post(`/api/user/addresses/${id}/default`);
  },

  /**
   * Convert a SavedAddress into the ShippingInfo shape used by checkout.
   * Pure mapping — no I/O.
   */
  prefillFromAddress(addr: SavedAddress): CheckoutShippingPrefill {
    return {
      firstName: addr.first_name,
      lastName: addr.last_name,
      email: addr.email ?? '',
      phone: addr.phone ?? '',
      address: addr.address,
      apartment: addr.apartment,
      city: addr.city,
      state: addr.state ?? '',
      postalCode: addr.postal_code,
      country: addr.country,
    };
  },
};
