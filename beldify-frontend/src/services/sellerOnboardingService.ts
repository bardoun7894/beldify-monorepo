/**
 * sellerOnboardingService — seller journey API
 *
 * Endpoints:
 *   GET  /api/seller/onboarding-status
 *   GET  /api/seller/store-profile
 *   PUT  /api/seller/store-profile          (multipart/form-data)
 *   GET  /api/seller/products
 *   POST /api/seller/products               (multipart/form-data)
 *
 * Mirror style of sellerService.ts + customOrderService.ts:
 *   - import api from '@/lib/api'
 *   - async functions, return response.data
 *   - multipart calls set Content-Type header
 *   - 403 = suspended (callers must handle)
 */
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions — exact field names from API contracts
// ─────────────────────────────────────────────────────────────────────────────

export type StoreStatus = 'pending' | 'active' | 'suspended' | 'not_started';
export type StepStatus = 'done' | 'incomplete';

export interface OnboardingStep {
  key: string;
  label: string;
  status: StepStatus;
}

export interface OnboardingStatusData {
  store_status: StoreStatus;
  needs_details: boolean;
  is_verified: boolean;
  verification_level: string;
  profile_completion_percentage: number;
  products_count: number;
  overall_percentage: number;
  steps: OnboardingStep[];
}

export interface OnboardingStatusResponse {
  data: OnboardingStatusData;
}

export interface StoreProfileData {
  name?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  store_logo?: string | null;
  store_banner?: string | null;
  store_locations?: StoreLocation[];
  profile_completion_percentage?: number;
  business_hours?: string | null;
  shipping_policy?: string | null;
  return_policy?: string | null;
}

export interface StoreLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  is_primary?: boolean;
}

export interface StoreProfileResponse {
  data: StoreProfileData;
}

export interface UpdateStoreProfilePayload {
  name: string;
  email: string;
  description?: string;
  phone?: string;
  address?: string;
  logo?: File | null;
  banner?: File | null;
  store_location?: StoreLocation;
  business_hours?: string;
  shipping_policy?: string;
  return_policy?: string;
}

export interface SellerProduct {
  id: number;
  name: string;
  price: string | number;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface SellerProductsResponse {
  data: SellerProduct[];
}

export interface CreateProductPayload {
  product_name_en: string;
  product_name_ar?: string;
  description?: string;
  description_ar?: string;
  category_id: number | string;
  current_sale_unit_price: number | string;
  quantity: number | string;
  is_active?: boolean;
  product_image?: File | null;
  images?: File[];
  cover_index?: number;
}

export interface CreateProductResponse {
  data: SellerProduct;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/seller/onboarding-status
 * Returns full onboarding status including step checklist + percentages.
 */
export async function getOnboardingStatus(): Promise<OnboardingStatusResponse> {
  const response = await api.get<OnboardingStatusResponse>('/api/seller/onboarding-status');
  return response.data;
}

/**
 * GET /api/seller/store-profile
 * Returns seller's store profile. Throws AxiosError with status 404 if no store.
 */
export async function getStoreProfile(): Promise<StoreProfileResponse> {
  const response = await api.get<StoreProfileResponse>('/api/seller/store-profile');
  return response.data;
}

/**
 * PUT /api/seller/store-profile
 * Updates seller store profile. Accepts multipart/form-data for file uploads.
 * Throws AxiosError with status 403 if store is suspended.
 */
export async function updateStoreProfile(payload: UpdateStoreProfilePayload): Promise<StoreProfileResponse> {
  const formData = new FormData();

  formData.append('name', payload.name);
  formData.append('email', payload.email);

  if (payload.description) formData.append('description', payload.description);
  if (payload.phone) formData.append('phone', payload.phone);
  if (payload.address) formData.append('address', payload.address);
  if (payload.logo) formData.append('logo', payload.logo);
  if (payload.banner) formData.append('banner', payload.banner);
  if (payload.business_hours) formData.append('business_hours', payload.business_hours);
  if (payload.shipping_policy) formData.append('shipping_policy', payload.shipping_policy);
  if (payload.return_policy) formData.append('return_policy', payload.return_policy);

  if (payload.store_location) {
    const loc = payload.store_location;
    if (loc.address) formData.append('store_location[address]', loc.address);
    if (loc.city) formData.append('store_location[city]', loc.city);
    if (loc.state) formData.append('store_location[state]', loc.state);
    if (loc.country) formData.append('store_location[country]', loc.country);
    if (typeof loc.is_primary !== 'undefined') {
      formData.append('store_location[is_primary]', loc.is_primary ? '1' : '0');
    }
  }

  const response = await api.put<StoreProfileResponse>('/api/seller/store-profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * GET /api/seller/products
 * Returns all of the seller's non-deleted products.
 */
export async function getSellerProducts(): Promise<SellerProductsResponse> {
  const response = await api.get<SellerProductsResponse>('/api/seller/products');
  return response.data;
}

/**
 * POST /api/seller/products
 * Creates a new product. Accepts multipart/form-data for file uploads.
 * Returns 201 on success. Throws AxiosError with status 403 if store suspended.
 */
export async function createSellerProduct(payload: CreateProductPayload): Promise<CreateProductResponse> {
  const formData = new FormData();

  formData.append('product_name_en', payload.product_name_en);
  if (payload.product_name_ar) formData.append('product_name_ar', payload.product_name_ar);
  if (payload.description) formData.append('description', payload.description);
  if (payload.description_ar) formData.append('description_ar', payload.description_ar);
  formData.append('category_id', String(payload.category_id));
  formData.append('current_sale_unit_price', String(payload.current_sale_unit_price));
  formData.append('quantity', String(payload.quantity));
  if (typeof payload.is_active !== 'undefined') {
    formData.append('is_active', payload.is_active ? '1' : '0');
  }
  if (payload.product_image) formData.append('product_image', payload.product_image);
  if (payload.images && payload.images.length > 0) {
    payload.images.forEach(img => formData.append('images[]', img));
  }
  if (typeof payload.cover_index !== 'undefined') {
    formData.append('cover_index', String(payload.cover_index));
  }

  const response = await api.post<CreateProductResponse>('/api/seller/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
