/**
 * sellerDashboardService — seller dashboard API layer
 *
 * Endpoints:
 *   GET   /api/seller/orders?status=&page=
 *   GET   /api/seller/orders/{id}
 *   PATCH /api/seller/orders/{id}/status
 *   GET   /api/seller/earnings?period=7|30|90
 *
 * Mirrors sellerOnboardingService.ts conventions:
 *   - import api from '@/lib/api'
 *   - async functions returning response.data
 *   - typed return values matching backend contracts
 */
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions — exact field names from API contracts
// ─────────────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface SellerOrderSummary {
  id: number;
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  total_amount: number;
  items_count: number;
  created_at: string;
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  variant?: string | null;
}

export interface SellerOrderDetail {
  id: number;
  order_number: string;
  status: OrderStatus;
  customer: { name: string };
  items: OrderItem[];
  subtotal: number;
  total_amount: number;
  commission_amount: number;
  commission_rate: number;
  net_amount: number;
  shipping_address: string;
  created_at: string;
}

export interface SellerOrdersMeta {
  current_page: number;
  last_page: number;
  total: number;
}

export interface SellerOrdersResponse {
  data: SellerOrderSummary[];
  meta: SellerOrdersMeta;
}

export interface SellerOrderDetailResponse {
  data: SellerOrderDetail;
}

export interface UpdateOrderStatusResponse {
  data: { id: number; status: OrderStatus };
}

export interface EarningsByDay {
  date: string;
  revenue: number;
}

export interface SellerEarningsData {
  currency: string;
  gross_revenue: number;
  total_commission: number;
  net_revenue: number;
  orders_count: number;
  average_order_value: number;
  by_day: EarningsByDay[];
  period: number;
}

export interface SellerEarningsResponse {
  data: SellerEarningsData;
}

export type EarningsPeriod = 7 | 30 | 90;

export interface GetSellerOrdersParams {
  status?: string;
  page?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/seller/orders?status=&page=
 * Returns paginated list of seller's orders.
 */
export async function getSellerOrders(
  params: GetSellerOrdersParams
): Promise<SellerOrdersResponse> {
  const queryParams: Record<string, string | number> = {};
  if (params.status) queryParams.status = params.status;
  if (params.page) queryParams.page = params.page;

  const response = await api.get<SellerOrdersResponse>('/api/seller/orders', {
    params: queryParams,
  });
  return response.data;
}

/**
 * GET /api/seller/orders/{id}
 * Returns full detail for a single order.
 */
export async function getSellerOrder(
  id: number
): Promise<SellerOrderDetailResponse> {
  const response = await api.get<SellerOrderDetailResponse>(
    `/api/seller/orders/${id}`
  );
  return response.data;
}

/**
 * PATCH /api/seller/orders/{id}/status
 * Updates the status of an order.
 * Throws AxiosError with status 403 if store is suspended.
 */
export async function updateOrderStatus(
  id: number,
  status: string
): Promise<UpdateOrderStatusResponse> {
  const response = await api.patch<UpdateOrderStatusResponse>(
    `/api/seller/orders/${id}/status`,
    { status }
  );
  return response.data;
}

/**
 * GET /api/seller/earnings?period=7|30|90
 * Returns earnings KPIs and daily breakdown for the given period.
 */
export async function getSellerEarnings(
  period: EarningsPeriod
): Promise<SellerEarningsResponse> {
  const response = await api.get<SellerEarningsResponse>('/api/seller/earnings', {
    params: { period },
  });
  return response.data;
}
