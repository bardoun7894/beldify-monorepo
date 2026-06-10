import { CartItem } from '@/contexts/CartContext';
import axios from 'axios';
import api from '@/lib/api';
import logger from '@/utils/consoleLogger';

export interface OrderItem {
  id: string;
  product_name: string;
  product_image?: string;
  primary_image?: string;  // New field from backend
  product_images?: string[]; // New field from backend (array of images)
  quantity: number;
  unit_price: number;
  total_price?: number; // New field from backend
  product?: {
    name: string;
    description?: string;
    image?: string;
    image_url?: string;
  };
  variant?: {
    color?: string;
    size?: string;
  };
}

export interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'awaiting_payment' | 'pending_verification' | 'rejected';
  total_amount: number;
  created_at: string;
  items: OrderItem[];
  items_count?: number;
  tracking_number?: string;
  estimated_delivery?: string;
  shipping_info?: ShippingInfo;
  shipping_address?: {
    city?: string;
    state?: string;
    country?: string;
    address?: string;
  };
  shipping_amount?: number;
  tax_amount?: number;
}

export interface ShippingInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zip_code?: string;
  country: string;
}

export interface PaymentInfo {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

export interface OrderData {
  items: Array<{
    product_id: number;
    quantity: number;
    unit_price: string | number;
    stock_id?: number;
    variant_id?: number;
    store_id?: number;
  }>;
  shipping_info: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string; 
    state: string;
    zip_code?: string;
    country: string;
  };
  payment_method: string;
  status: string;
  subtotal: string;
  tax_amount: string;
  shipping_amount: string;
  discount_amount: string;
  total_amount: string;
  coupon_code: string | null;
  // Allow optional customer_id to be included when available
  customer_id?: number;
}

class OrderService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any {
    return this.cache.get(key)?.data;
  }

  private clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Public method to reset cache safely from consumers
  resetCache(key?: string): void {
    this.clearCache(key);
  }

  private getUserId(): number | null {
    try {
      // Try to get user data from multiple sources
      // Safely check if window/localStorage is available (client-side only)
      if (typeof window !== 'undefined' && window.localStorage) {
        // First try to get from cached_user_data which is used by AuthContext
        const cachedUserData = localStorage.getItem('cached_user_data');
        if (cachedUserData) {
          const { user } = JSON.parse(cachedUserData);
          return user?.id || null;
        }
        
        // Fallback to user_profile for backward compatibility
        const userProfile = localStorage.getItem('user_profile');
        if (userProfile) {
          const userData = JSON.parse(userProfile);
          return userData.id || null;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error getting user ID:', error);
      return null;
    }
  }

  async getOrders(): Promise<Order[]> {
    const userId = this.getUserId();

    if (!userId) {
      logger.warn('No authenticated user found, returning empty orders array');
      return [];
    }

    try {
      const cacheKey = 'orders';
      const cachedData = this.getCache(cacheKey);
      if (cachedData) {
        logger.log('Using cached orders:', cachedData);
        return cachedData;
      }

      logger.log('Fetching fresh orders from API with user ID:', userId);
      
      // Use proper query parameters format
      const response = await api.get('/api/orders', {
        params: { customer_id: userId }
      });
      
      logger.log('API Response:', response.data);
      logger.log('Response status:', response.status);

      // Support both { success: true, data: [...] } and { status: 'success', data: [...] } formats
      const isSuccess = response.data?.success || response.data?.status === 'success';
      if (isSuccess && Array.isArray(response.data.data)) {
        const orders = response.data.data;
        logger.log('Parsed orders:', orders);
        this.setCache(cacheKey, orders);
        return orders;
      }
      throw new Error(response.data?.message || 'Failed to fetch orders');
    } catch (error) {
      logger.error('Full error details:', error);
      // Use axios.isAxiosError and type guard
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to fetch orders: ${message}`);
      }
      throw error;
    }
  }

  async getOrderDetails(orderNumber: string): Promise<Order> {
    try {
      const cacheKey = `order:${orderNumber}`;
      const cachedData = this.getCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await api.get(`/api/orders/${orderNumber}`);
      const isSuccess = response.data?.success || response.data?.status === 'success';
      if (isSuccess && response.data.data) {
        const order = response.data.data;
        this.setCache(cacheKey, order);
        return order;
      }
      throw new Error(response.data?.message || 'Failed to fetch order details');
    } catch (error) {
      // Use axios.isAxiosError and type guard
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('order_not_found');
        }
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to fetch order details: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Public quote endpoint — resolves authoritative totals + COD eligibility.
   * No auth required (guest-safe). POST /api/orders/quote
   */
  async getCheckoutQuote(payload: {
    items: Array<{ stock_id?: number; quantity: number }>;
    country?: string;
    coupon_code?: string | null;
  }): Promise<{
    subtotal: number;
    tax_amount: number;
    shipping_amount: number;
    discount_amount: number;
    total_amount: number;
    cod_allowed: boolean;
    cod_max: number;
    currency: string;
  }> {
    const response = await api.post('/api/orders/quote', payload);
    return response.data;
  }

  /**
   * Payout account + how-to-pay instructions for an offline transfer method.
   */
  async getPaymentInstructions(
    method: string
  ): Promise<{ method: string; label: string; account: string; instructions: string } | null> {
    try {
      const response = await api.get(`/api/payment-methods/${method}/instructions`);
      return response.data?.data ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Upload an offline-transfer payment receipt for an order.
   * Backend: POST /api/orders/{orderNumber}/payment-proof (multipart).
   * Works for guests too — the shipping email proves ownership.
   */
  async uploadPaymentProof(
    orderNumber: string,
    file: File,
    opts: { reference?: string; email?: string } = {}
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (opts.reference) formData.append('reference', opts.reference);
      if (opts.email) formData.append('email', opts.email);

      const response = await api.post(
        `/api/orders/${encodeURIComponent(orderNumber)}/payment-proof`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data?.status === 'error') {
        throw new Error(response.data?.message || 'Failed to upload payment proof');
      }
    } catch (error) {
      logger.error('Error uploading payment proof:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || error.message || 'Failed to upload payment proof'
        );
      }
      throw error;
    }
  }

  async createOrder(orderData: OrderData) {
    try {
      logger.log('Creating order with payload (raw):', orderData);

      // Get authenticated user id if available
      const userId = this.getUserId();

      // Sanitize items to only include fields expected by backend
      const sanitizedItems = (orderData.items || []).map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price,
        ...(item.stock_id ? { stock_id: item.stock_id } : {}),
        ...(item.variant_id ? { variant_id: item.variant_id } : {}),
        store_id: item.store_id ?? 0,
      }));

      // Helper to parse numeric fields safely
      const toNumber = (val: any) => {
        const n = typeof val === 'string' ? parseFloat(val) : val;
        return Number.isFinite(n) ? n : 0;
      };

      // Build payload expected by backend
      const payload: any = {
        items: sanitizedItems,
        shipping_info: orderData.shipping_info,
        payment_method: orderData.payment_method,
        status: orderData.status || 'pending',
        subtotal: toNumber(orderData.subtotal),
        tax_amount: toNumber(orderData.tax_amount),
        shipping_amount: toNumber(orderData.shipping_amount),
        discount_amount: toNumber(orderData.discount_amount),
        total_amount: toNumber(orderData.total_amount),
        coupon_code: orderData.coupon_code ?? null,
      };

      // Include customer_id if user is authenticated
      if (userId) {
        payload.customer_id = userId;
      }

      // Ensure we don't send unsupported fields accidentally (e.g., items_by_store)
      if ((payload as any).items_by_store) {
        delete (payload as any).items_by_store;
      }

      logger.log('Creating order with payload (sanitized):', payload);

      const response = await api.post('/api/orders', payload);

      logger.log('Order creation response:', response.data);

      return response.data;
    } catch (error: any) {
      logger.error('Error creating order:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message || 'Failed to create order');
      }
      throw error;
    }
  }

  /**
   * Guest (unauthenticated) COD checkout.
   * Posts to POST /api/orders/checkout — a public endpoint that requires no auth.
   * Payload shape mirrors createOrder but without the auth-only fields (customer_id).
   */
  async createCheckoutOrder(payload: {
    items: Array<{
      stock_id?: number;
      variant_id?: number;
      quantity: number;
      unit_price: number;
      product_id?: number;
      store_id?: number;
    }>;
    shipping_info: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      address?: string;
      apartment?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      country?: string;
    };
    payment_method: string;
    subtotal: number;
    total_amount: number;
    shipping_amount: number;
    tax_amount: number;
    discount_amount: number;
    coupon_code?: string | null;
  }) {
    try {
      logger.log('Creating guest checkout order:', payload);
      const response = await api.post('/api/orders/checkout', payload);
      logger.log('Guest checkout response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating guest checkout order:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message || 'Failed to create order');
      }
      throw error;
    }
  }

  async processPayment(
    amount: number,
    paymentInfo: PaymentInfo,
    paymentMethod: string
  ): Promise<void> {
    if (paymentMethod === 'cod') return;

    try {
      const response = await api.post('/api/payments', {
        amount,
        payment_info: paymentInfo,
        payment_method: paymentMethod,
      });

      if (!response.data?.success) {
        throw new Error('Payment failed');
      }
    } catch (error) {
      logger.error('Payment processing error:', error);
      throw new Error('Failed to process payment');
    }
  }

  calculateShipping(items: CartItem[], country: string): number {
    // Define allowed keys for shippingRates
    type ShippingCountryCode = 'MA' | 'US' | 'DEFAULT';
    const shippingRates: Record<ShippingCountryCode, { baseRate: number; additionalItemRate: number }> = {
      MA: {
        baseRate: 50.0,
        additionalItemRate: 10.0,
      },
      US: {
        baseRate: 5.99,
        additionalItemRate: 2.0,
      },
      DEFAULT: {
        baseRate: 14.99,
        additionalItemRate: 3.0,
      },
    };

    // Assert country type before indexing
    const countryCode = country.toUpperCase() as ShippingCountryCode;
    const rate = shippingRates[countryCode] || shippingRates.DEFAULT;
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);

    return rate.baseRate + (itemCount > 1 ? (itemCount - 1) * rate.additionalItemRate : 0);
  }

  calculateTax(subtotal: number, state: string): number {
    // Define allowed keys for taxRates
    type TaxCountryCode = 'MA' | 'US' | 'DEFAULT';
    const taxRates: Record<TaxCountryCode, number> = {
      MA: 0.2,
      US: 0.08,
      DEFAULT: 0.1,
    };

    const country = state.substring(0, 2).toUpperCase();
    // Assert country type before indexing
    const countryCode = country as TaxCountryCode;
    const taxRate = taxRates[countryCode] || taxRates.DEFAULT;

    return subtotal * taxRate;
  }

  /**
   * Cancel an authenticated user's order.
   *
   * POST /api/orders/{orderNumber}/cancel
   * Body: { reason?: string (≤500 chars) }
   *
   * Returns {success:true, order:{...}} on 200.
   * Throws with API message on 403 (not owner), 404 (not found),
   * or 422 (not cancellable — paid / shipped).
   */
  async cancel(
    orderNumber: string,
    reason?: string
  ): Promise<{ success: true; order: Order }> {
    try {
      const body: Record<string, string> = {};
      if (reason !== undefined) {
        body.reason = reason;
      }
      const response = await api.post(`/api/orders/${orderNumber}/cancel`, body);
      const data = response.data;
      if (data?.success && data?.order) {
        // Invalidate cached order so the next fetch picks up the new status.
        this.clearCache(`order:${orderNumber}`);
        return { success: true, order: data.order };
      }
      throw new Error(data?.message || 'cancel_failed');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || error.message || 'cancel_failed'
        );
      }
      throw error;
    }
  }

  /**
   * Re-add all items from a past order into the authenticated user's cart
   * at current prices and stock levels.
   *
   * POST /api/orders/{orderNumber}/reorder
   *
   * Returns a summary of what was added and what was skipped (with reasons).
   * Skipped items are products that are out of stock or no longer available.
   */
  async reorder(orderNumber: string): Promise<{
    items_added: number;
    items_skipped: number;
    skipped: Array<{ stock_id: number; reason: string }>;
  }> {
    const response = await api.post(`/api/orders/${orderNumber}/reorder`);
    const isSuccess =
      response.data?.status === 'success' || response.data?.success === true;
    if (isSuccess && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Reorder failed');
  }
}

export const orderService = new OrderService();
