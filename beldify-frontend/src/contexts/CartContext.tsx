'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '@/services/api';
import { useAuth } from './AuthContext';
import toast from '@/utils/toast';
import logger from '@/utils/consoleLogger';
import { Product } from '@/lib/types';
import { ApiError } from '@/types/error';
import { getCache, setCache, clearCache } from '@/app/api/cache';
import { useTranslation } from 'react-i18next';

export interface CartItem { 
  id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  stock_id: number;
  variant_id?: number;
  product: {
    id: number;
    name: string;
    name_ar: string;
    image_url: string;
    price: number;
    color?: string;
    size?: string;
    stock_quantity?: number;
  };
  store?: {
    id: number;
    name: string;
    logo?: string;
  };
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  coupon_code: string | null;
}

interface CartContextType {
  state: CartState | null;
  loading: boolean;
  isInitialLoading: boolean;
  addItem: (id: number, quantity: number, type?: 'stock' | 'variant') => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  clearCart: () => Promise<void>;
  addToCart: (product: Product) => Promise<void>;
}

const defaultState: CartState = {
  items: [],
  subtotal: 0,
  tax_amount: 0,
  shipping_amount: 0,
  discount_amount: 0,
  total_amount: 0,
  coupon_code: null,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const fetchCart = async (skipCache = false) => {
    try {
      setLoading(true);

      if (!skipCache) {
        const cachedCart = await getCache('cart') as CartState | null;
        if (cachedCart) {
          setState(cachedCart);
          setLoading(false);
          setIsInitialLoading(false);
          return;
        }
      }

      const response = await cartService.getCart();

      if (response.status === 'success' && response.data) {
        const cartData: CartState = {
          items: response.data.items || [],
          subtotal: response.data.cart?.subtotal || 0,
          tax_amount: response.data.cart?.tax_amount || 0,
          shipping_amount: response.data.cart?.shipping_amount || 0,
          discount_amount: response.data.cart?.discount_amount || 0,
          total_amount: response.data.cart?.total_amount || 0,
          coupon_code: response.data.cart?.coupon_code || null,
        };

        if (!skipCache) {
          await setCache('cart', cartData);
        }
        setState(cartData);
      } else {
        setState(defaultState);
      }
    } catch (error: any) {
      logger.error('Error fetching cart:', error);
      setState(defaultState);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  const invalidateCartCache = async () => {
    await clearCache('cart');
    await fetchCart(true);
  };

  const validateStock = async (id: number, quantity: number, variantId?: number, type?: 'stock' | 'variant'): Promise<boolean> => {
    try {
      logger.log('Validating stock for ID:', id, 'with quantity:', quantity, 'variantId:', variantId, 'type:', type);
      
      const stockAvailable = type === 'variant' && variantId
        ? await cartService.checkStock(id, variantId)
        : await cartService.checkStock(id);
      
      if (stockAvailable.status === 'error') {
        logger.error('Stock check failed:', stockAvailable);
        const error = new Error('Failed to check stock availability') as ApiError;
        error.response = {
          data: {
            type: 'stock_check_failed',
            message: 'Unable to verify product availability. Please try again.'
          }
        };
        throw error;
      }

      // null available_quantity means made-to-order (unlimited production) — always available.
      // Guard placed BEFORE the out_of_stock status check so that a mis-classified
      // status (backend sends out_of_stock but quantity is null) does not block purchase.
      if (stockAvailable.available_quantity === null) return true;

      // Handle out of stock cases
      if (['out_of_stock', 'no_stock', 'variant_not_found'].includes(stockAvailable.status) || stockAvailable.available_quantity === 0) {
        const error = new Error('Product is out of stock') as ApiError;
        error.response = {
          data: {
            type: 'out_of_stock',
            message: 'This product is currently out of stock'
          }
        };
        throw error;
      }

      // Allow order if requested quantity exactly matches available stock
      if (stockAvailable.available_quantity === quantity) {
        return true;
      }

      // Check if available quantity is sufficient
      if (stockAvailable.available_quantity < quantity) {
        const error = new Error('Insufficient stock') as ApiError & {
          response: {
            data: {
              type: string;
              message: string;
              available_quantity: number | null;
            };
          };
        };
        error.response = {
          data: {
            type: 'insufficient_stock',
            message: `Only ${stockAvailable.available_quantity} item${stockAvailable.available_quantity !== 1 ? 's' : ''} available`,
            available_quantity: stockAvailable.available_quantity
          }
        };
        throw error;
      }

      // Log low stock warning if applicable
      if (stockAvailable.status === 'low_stock') {
        logger.warn(`Low stock warning: ${stockAvailable.available_quantity} items remaining for product ${id}`);
      }

      return true;
    } catch (error) {
      logger.error('Error checking stock:', error);
      throw error; 
    }
  };

  const addItem = async (id: number, quantity: number, type: 'stock' | 'variant' = 'stock') => {
    try {
      setLoading(true);
      const validId = Number(id);
      const validQuantity = Number(quantity);

      // Input validation
      if (isNaN(validId) || validId <= 0) {
        logger.log(`Invalid product ID: ${validId}`);
        toast.error('Invalid product ID');
        return;
      }
      
      if (isNaN(validQuantity) || validQuantity < 1) {
        logger.log(`Invalid quantity: ${validQuantity}`);
        toast.error('Quantity must be at least 1');
        return;
      }

      // Check stock availability
      try {
        await validateStock(validId, validQuantity, type === 'variant' ? validId : undefined, type);
      } catch (error: any) {
        // Handle specific stock-related errors
        if (error.response?.data?.type === 'out_of_stock') {
          toast.error('This product is currently out of stock');
          return;
        } else if (error.response?.data?.type === 'insufficient_stock') {
          toast.error(error.response.data.message || 'Not enough stock available');
          return;
        } else if (error.response?.data?.type === 'stock_check_failed') {
          toast.error('Unable to verify product availability. Please try again.');
          return;
        }
        // Re-throw other errors to be caught by the outer catch block
        throw error;
      }

      const existingItem = state?.items?.find(item =>
        (type === 'stock' && item.stock_id === validId) ||
        (type === 'variant' && item.variant_id === validId)
      );

      if (existingItem?.product.stock_quantity !== undefined) {
        const totalQuantity = existingItem.quantity + validQuantity;
        const remainingStock = existingItem.product.stock_quantity - existingItem.quantity;

        if (totalQuantity > existingItem.product.stock_quantity) {
          if (remainingStock <= 0) {
            toast.error('This item is out of stock');
          } else {
            toast.error(`Cannot add ${validQuantity} items. Only ${remainingStock} more available in stock`);
          }
          return;
        }
      }

      const payload = type === 'stock'
        ? { stock_id: validId, quantity: validQuantity }
        : { variant_id: validId, quantity: validQuantity };

      logger.log('[cart] addItem payload:', JSON.stringify(payload), '| type:', type);
      const response = await cartService.addItem(payload);
      logger.log('[cart] addItem response.status:', response?.status);
      if (response.status === 'success') {
        await invalidateCartCache();
        logger.log('Item added to cart successfully');
        toast.success('Item added to cart');
      } else {
        logger.log(`Error adding item to cart: ${response.message}`);
        toast.error(response.message || 'Failed to add item to cart');
      }
    } catch (error: any) {
      logger.error('Error adding item to cart:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid request');
      } else if (error.response?.status === 404) {
        toast.error('Product not found');
      } else if (error.response?.status === 422) {
        // Handle 422 Unprocessable Entity (validation errors)
        const errorMessage = error.response.data.message || 'Validation error';
        if (error.response.data.errors?.quantity?.[0]?.includes('greater than available')) {
          toast.error('The requested quantity exceeds available stock');
        } else {
          toast.error(errorMessage);
        }
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add item to cart. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      setLoading(true);
      
      // Input validation
      if (isNaN(quantity) || quantity < 1) {
        logger.log(`Invalid quantity: ${quantity}`);
        toast.error('Quantity must be at least 1');
        return;
      }

      const currentItem = state?.items?.find(item => item.id === itemId);
      if (!currentItem) {
        logger.error(`Item with ID ${itemId} not found in cart`);
        toast.error('Item not found in cart');
        return;
      }

      // Check stock availability
      try {
        await validateStock(
          currentItem.stock_id, 
          quantity,
          currentItem.variant_id,
          currentItem.variant_id ? 'variant' : 'stock'
        );
      } catch (error: any) {
        // Handle specific stock-related errors
        if (error.response?.data?.type === 'out_of_stock') {
          toast.error('This product is currently out of stock');
          return;
        } else if (error.response?.data?.type === 'insufficient_stock') {
          toast.error(error.response.data.message || 'Not enough stock available');
          return;
        } else if (error.response?.data?.type === 'stock_check_failed') {
          toast.error('Unable to verify product availability. Please try again.');
          return;
        }
        // Re-throw other errors to be caught by the outer catch block
        throw error;
      }

      const response = await cartService.updateQuantity(itemId, quantity);

      if (response.status === 'success') {
        await invalidateCartCache();
        toast.success('Cart updated');
        
        // Show low stock warning if applicable
        if (response.data?.stock_status === 'low_stock' && response.data.available_quantity) {
          toast.error(`Only ${response.data.available_quantity} items left in stock`);
        }
      } else {
        toast.error(response.message || 'Failed to update cart');
      }
    } catch (error: any) {
      logger.error('Error updating quantity:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid request');
      } else if (error.response?.status === 404) {
        toast.error('Cart item not found');
      } else if (error.response?.status === 422) {
        // Handle 422 Unprocessable Entity (validation errors)
        const errorMessage = error.response.data.message || 'Validation error';
        if (error.response.data.errors?.quantity?.[0]?.includes('greater than available')) {
          toast.error('The requested quantity exceeds available stock');
        } else {
          toast.error(errorMessage);
        }
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update cart. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: number) => {
    try {
      setLoading(true);
      await cartService.removeItem(itemId);
      await invalidateCartCache();
      toast.success('Item removed from cart');
    } catch (error: any) {
      logger.error('Error removing item:', error);
      toast.error('Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      setLoading(true);
      await cartService.applyCoupon(code);
      await invalidateCartCache();
      toast.success(t('cart.coupon.applied', { code }));
    } catch (error: any) {
      logger.error('Error applying coupon:', error);
      const message = error?.response?.data?.message;
      toast.error(typeof message === 'string' ? message : t('cart.coupon.invalid'));
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = async () => {
    try {
      setLoading(true);
      await cartService.removeCoupon();
      await invalidateCartCache();
      toast.success(t('cart.coupon.removed'));
    } catch (error: any) {
      logger.error('Error removing coupon:', error);
      const message = error?.response?.data?.message;
      toast.error(typeof message === 'string' ? message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await cartService.clearCart();
      await clearCache('cart');
      setState(defaultState);
      toast.success('Cart cleared');
    } catch (error: any) {
      logger.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: Product) => {
    await addItem(product.id, 1);
  };

  useEffect(() => {
    fetchCart();
    // refresh after login/logout (guest cart may have just been merged) and on
    // explicit cart:refresh events (e.g. AuthContext after merge-guest succeeds)
    const onRefresh = () => fetchCart();
    window.addEventListener('cart:refresh', onRefresh);
    return () => window.removeEventListener('cart:refresh', onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const value = {
    state,
    loading,
    isInitialLoading,
    addItem,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    clearCart,
    addToCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
