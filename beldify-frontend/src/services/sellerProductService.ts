/**
 * sellerProductService — single-product CRUD for seller area
 *
 * Endpoints:
 *   GET /api/seller/products/{id}   — fetch one owned product
 *   PUT /api/seller/products/{id}   — partial-update an owned product
 *
 * Mirrors sellerOnboardingService.ts conventions:
 *   - import api from '@/lib/api'
 *   - async functions returning response.data
 *   - multipart for file-containing updates; JSON otherwise
 *   - 403 = suspended (callers must handle)
 *   - 404 = product not found (callers must handle)
 */
import api from '@/lib/api';
import type { SellerProduct, CreateProductPayload } from './sellerOnboardingService';

// ─── Response types ───────────────────────────────────────────────────────────

export interface SellerProductDetailResponse {
  data: SellerProduct;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  // All fields from CreateProductPayload are optional for a partial update
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * GET /api/seller/products/{id}
 * Returns a single owned product.
 * Throws AxiosError with status 404 if the product is not found.
 * Throws AxiosError with status 403 if the store is suspended.
 */
export async function getSellerProduct(id: number | string): Promise<SellerProductDetailResponse> {
  const response = await api.get<SellerProductDetailResponse>(`/api/seller/products/${id}`);
  return response.data;
}

/**
 * PUT /api/seller/products/{id}
 * Partial-updates an owned product. Accepts multipart/form-data for file uploads.
 * All fields are optional — only provided fields are updated.
 * Returns {success: true, data: {product}} on success.
 * Throws AxiosError with status 422 for validation errors.
 * Throws AxiosError with status 403 if the store is suspended.
 */
export async function updateSellerProduct(
  id: number | string,
  payload: UpdateProductPayload
): Promise<SellerProductDetailResponse> {
  const formData = new FormData();

  if (payload.product_name_en !== undefined) formData.append('product_name_en', payload.product_name_en);
  if (payload.product_name_ar !== undefined) formData.append('product_name_ar', payload.product_name_ar);
  if (payload.description !== undefined) formData.append('description', payload.description);
  if (payload.description_ar !== undefined) formData.append('description_ar', payload.description_ar);
  if (payload.category_id !== undefined) formData.append('category_id', String(payload.category_id));
  if (payload.current_sale_unit_price !== undefined) {
    formData.append('current_sale_unit_price', String(payload.current_sale_unit_price));
  }
  if (payload.quantity !== undefined) formData.append('quantity', String(payload.quantity));
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

  const response = await api.put<SellerProductDetailResponse>(
    `/api/seller/products/${id}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

/**
 * DELETE /api/seller/products/{id}
 * Permanently deletes an owned product.
 * Throws AxiosError with status 404 if the product is not found.
 * Throws AxiosError with status 403 if the store is suspended.
 */
export async function deleteSellerProduct(id: number | string): Promise<void> {
  await api.delete(`/api/seller/products/${id}`);
}
