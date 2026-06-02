/**
 * customOrderService — buyer + seller custom-order API
 *
 * Typed against contracts.md §A2–A6 (FROZEN).
 * LIVE WIRING (WS-A): all mock branches are marked with the comment
 *   // LIVE WIRING (WS-A): replace with api.{method}(...)
 *
 * Lifecycle statuses (from contracts.md §A6 transition table):
 *   requested → quoted → deposit_paid → in_progress → ready → delivered → closed
 *   Any pre-delivered state can also → cancelled
 */
import api from '@/lib/api';
import { VerticalSlug } from './verticalService';

// ─────────────────────────────────────────────────────────────────────────────
// Contract types
// ─────────────────────────────────────────────────────────────────────────────

export type CustomOrderStatus =
  | 'requested'
  | 'quoted'
  | 'deposit_paid'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'closed'
  | 'cancelled';

export interface CustomOrderProgress {
  id: number;
  status: CustomOrderStatus;
  note: string | null;
  created_by: number;
  created_at: string;
}

export interface CustomOrderStore {
  id: number;
  name: string;
  slug: string;
}

export interface CustomOrderCustomer {
  id: number;
  display_name: string;
}

/** Full custom-order resource (contracts.md §A7) */
export interface CustomOrder {
  id: number;
  store_id: number;
  vertical: VerticalSlug;
  spec: Record<string, string | number | null>;
  notes: string | null;
  status: CustomOrderStatus;
  quote_amount: string | null;
  deposit_amount: string | null;
  deposit_paid: boolean;
  eta: string | null;
  delivery_date: string | null;
  customer: CustomOrderCustomer;
  store: CustomOrderStore;
  progress: CustomOrderProgress[];
  created_at: string;
  updated_at: string;
}

/** List item (spec omitted — contracts.md §A4) */
export interface CustomOrderListItem extends Omit<CustomOrder, 'spec' | 'progress' | 'customer'> {}

/** POST /api/v1/custom-orders request body */
export interface SubmitCustomOrderPayload {
  store_id: number;
  vertical: VerticalSlug;
  spec: Record<string, string | number | null>;
  notes?: string;
}

/** POST /api/v1/custom-orders/{id}/quote request body */
export interface QuotePayload {
  quote_amount: number;
  deposit_amount: number;
  eta: string; // Y-m-d
}

/** POST /api/v1/custom-orders/{id}/advance request body */
export interface AdvancePayload {
  status: CustomOrderStatus;
  note?: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CustomOrderListResponse {
  data: CustomOrderListItem[];
  meta: PaginationMeta;
}

// ─────────────────────────────────────────────────────────────────────────────
// Allowed next-status map (contracts.md §A6 transition table)
// ─────────────────────────────────────────────────────────────────────────────

export const ALLOWED_NEXT_STATUSES: Partial<Record<CustomOrderStatus, CustomOrderStatus[]>> = {
  requested: ['cancelled'], // quote transition is exclusive to /quote endpoint (D4-RESOLVED)
  quoted: ['deposit_paid', 'cancelled'],
  deposit_paid: ['in_progress', 'cancelled'],
  in_progress: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: ['closed'],
  closed: [],
  cancelled: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Atlas status → UI metadata (shared by T032 + T036)
// ─────────────────────────────────────────────────────────────────────────────

export interface StatusMeta {
  label: string;
  labelAr: string;
  pillClass: string; // Tailwind classes for Atlas pill
}

export const STATUS_META: Record<CustomOrderStatus, StatusMeta> = {
  requested:    { label: 'Requested',    labelAr: 'مُقدَّم',      pillClass: 'bg-amber-100 text-amber-800 ring-amber-300' },
  quoted:       { label: 'Quoted',       labelAr: 'مُسعَّر',      pillClass: 'bg-indigo-100 text-indigo-800 ring-indigo-300' },
  deposit_paid: { label: 'Deposit Paid', labelAr: 'العربون مدفوع', pillClass: 'bg-teal-100 text-teal-800 ring-teal-300' },
  in_progress:  { label: 'In Progress',  labelAr: 'قيد التنفيذ',  pillClass: 'bg-sky-100 text-sky-800 ring-sky-300' },
  ready:        { label: 'Ready',        labelAr: 'جاهز',          pillClass: 'bg-emerald-100 text-emerald-800 ring-emerald-300' },
  delivered:    { label: 'Delivered',    labelAr: 'تم التسليم',    pillClass: 'bg-green-100 text-green-800 ring-green-300' },
  closed:       { label: 'Closed',       labelAr: 'مُغلق',         pillClass: 'bg-gray-100 text-gray-700 ring-gray-300' },
  cancelled:    { label: 'Cancelled',    labelAr: 'مُلغى',         pillClass: 'bg-rose-100 text-rose-800 ring-rose-300' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — exact shapes from contracts.md
// ─────────────────────────────────────────────────────────────────────────────

const USE_MOCK = true; // LIVE WIRING (WS-A): set to false once endpoints are live

const MOCK_CUSTOM_ORDER: CustomOrder = {
  id: 87,
  store_id: 12,
  vertical: 'jewelry',
  spec: { material: 'gold', purity: '18k', weight_grams: 5.2, gemstone_type: 'emerald', gemstone_count: 1, gemstone_carat: 0.5, engraving: 'لنا', finish: 'polished' },
  notes: 'For a wedding, needed by end of month',
  status: 'quoted',
  quote_amount: '1200.00',
  deposit_amount: '400.00',
  deposit_paid: false,
  eta: '2026-06-30',
  delivery_date: null,
  customer: { id: 44, display_name: 'FATIMA Z.' },
  store: { id: 12, name: 'Atlas Bijoux', slug: 'atlas-bijoux' },
  progress: [
    { id: 1, status: 'requested', note: null, created_by: 44, created_at: '2026-06-02T10:00:00Z' },
    { id: 2, status: 'quoted', note: 'Price includes 18k gold + emerald setting', created_by: 99, created_at: '2026-06-03T09:15:00Z' },
  ],
  created_at: '2026-06-02T10:00:00Z',
  updated_at: '2026-06-03T09:15:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// Public service functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Buyer: submit a custom order.
 * LIVE WIRING (WS-A): replace mock body with api.post('/api/v1/custom-orders', payload)
 */
export async function submitCustomOrder(payload: SubmitCustomOrderPayload): Promise<CustomOrder> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 0));
    return {
      ...MOCK_CUSTOM_ORDER,
      store_id: payload.store_id,
      vertical: payload.vertical,
      spec: payload.spec,
      notes: payload.notes ?? null,
      status: 'requested',
      quote_amount: null,
      deposit_amount: null,
      deposit_paid: false,
      eta: null,
      progress: [],
    };
  }
  // LIVE PATH
  const res = await api.post<{ data: CustomOrder }>('/api/v1/custom-orders', payload);
  return res.data.data;
}

/**
 * Buyer: get a single custom order with full progress timeline.
 * LIVE WIRING (WS-A): replace mock body with api.get(`/api/v1/custom-orders/${id}`)
 */
export async function fetchCustomOrder(id: number): Promise<CustomOrder> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 0));
    return { ...MOCK_CUSTOM_ORDER, id };
  }
  // LIVE PATH
  const res = await api.get<{ data: CustomOrder }>(`/api/v1/custom-orders/${id}`);
  return res.data.data;
}

/**
 * Buyer: list own custom orders.
 * LIVE WIRING (WS-A): replace mock body with api.get('/api/v1/custom-orders', { params })
 */
export async function fetchCustomOrders(params?: {
  status?: CustomOrderStatus;
  vertical?: VerticalSlug;
  page?: number;
}): Promise<CustomOrderListResponse> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 0));
    return {
      data: [{ ...MOCK_CUSTOM_ORDER } as unknown as CustomOrderListItem],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    };
  }
  // LIVE PATH
  const res = await api.get<CustomOrderListResponse>('/api/v1/custom-orders', { params });
  return res.data;
}

/**
 * Seller: submit a quote for a requested order.
 * Only valid when order.status === 'requested' (409 otherwise — D4-RESOLVED).
 * LIVE WIRING (WS-A): replace mock body with api.post(`/api/v1/custom-orders/${id}/quote`, payload)
 */
export async function submitQuote(id: number, payload: QuotePayload): Promise<CustomOrder> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 0));
    return {
      ...MOCK_CUSTOM_ORDER,
      id,
      status: 'quoted',
      quote_amount: String(payload.quote_amount),
      deposit_amount: String(payload.deposit_amount),
      eta: payload.eta,
    };
  }
  // LIVE PATH
  const res = await api.post<{ data: CustomOrder }>(`/api/v1/custom-orders/${id}/quote`, payload);
  return res.data.data;
}

/**
 * Seller: advance a custom order through its lifecycle.
 * Allowed transitions per contracts.md §A6 transition table.
 * LIVE WIRING (WS-A): replace mock body with api.post(`/api/v1/custom-orders/${id}/advance`, payload)
 */
export async function advanceCustomOrder(id: number, payload: AdvancePayload): Promise<CustomOrder> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 0));
    return {
      ...MOCK_CUSTOM_ORDER,
      id,
      status: payload.status,
      progress: [
        ...MOCK_CUSTOM_ORDER.progress,
        { id: MOCK_CUSTOM_ORDER.progress.length + 1, status: payload.status, note: payload.note ?? null, created_by: 99, created_at: new Date().toISOString() },
      ],
    };
  }
  // LIVE PATH
  const res = await api.post<{ data: CustomOrder }>(`/api/v1/custom-orders/${id}/advance`, payload);
  return res.data.data;
}

export const customOrderService = {
  submitCustomOrder,
  fetchCustomOrder,
  fetchCustomOrders,
  submitQuote,
  advanceCustomOrder,
};
