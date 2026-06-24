import { ApiResponse } from '@/types/api';

export interface CartServiceResponse extends ApiResponse<any> {
  status: 'success' | 'error';
  message?: string;
}

export interface StockResponse {
  status: 'in_stock' | 'out_of_stock' | 'no_stock' | 'low_stock' | 'variant_not_found' | 'error';
  available_quantity: number | null;
  message?: string;
  success?: boolean;
  stock_id?: number;
  variant_id?: number;
  made_to_order?: boolean;
}

export interface CartService {
  mergeGuestCart(): Promise<CartServiceResponse>;
  getCart(): Promise<CartServiceResponse>;
  addItem(payload: { stock_id?: number; variant_id?: number; quantity: number }): Promise<CartServiceResponse>;
  updateQuantity(itemId: number, quantity: number): Promise<CartServiceResponse>;
  removeItem(itemId: number): Promise<CartServiceResponse>;
  applyCoupon(code: string): Promise<CartServiceResponse>;
  removeCoupon(): Promise<CartServiceResponse>;
  clearCart(): Promise<CartServiceResponse>;
  checkStock(stockId: number, variantId?: number): Promise<StockResponse>;
  getCartRelatedProducts(productId?: string, limit?: number): Promise<any>;
}
