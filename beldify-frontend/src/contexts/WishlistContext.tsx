'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import axios from '@/lib/axios';
import toast from '@/utils/toast';
import logger from '@/utils/consoleLogger';
import { productService } from '@/services/api';
import {
  getGuestWishlist,
  addGuestWishlistItem,
  removeGuestWishlistItem,
  clearGuestWishlist,
} from '@/utils/guestWishlist';

interface WishlistItem {
  id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    slug: string;
    description: string;
    image_url: string;
    price: number;
    sale_price: number | null;
    is_on_sale: boolean;
    discount_percentage: number;
    variants: {
      size: string;
      color: string;
      style: string;
    };
  };
}

export interface WishlistNotifyOpts {
  notify_back_in_stock?: boolean;
  notify_price_drop?: boolean;
  target_price?: number;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isInWishlist: (productId: number) => boolean;
  addToWishlist: (productId: number, opts?: WishlistNotifyOpts) => Promise<void>;
  updateWishlistNotifications: (productId: number, opts: WishlistNotifyOpts) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  isLoading: boolean;
}

// getImagePath function to get the image path
function getImagePath(imageUrl: string): string {
  return imageUrl;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const refreshWishlist = async () => {
    if (!isAuthenticated) {
      // Guest path: load from localStorage instead of clearing
      const localItems = getGuestWishlist() as WishlistItem[];
      setWishlistItems(localItems);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get('/api/wishlist');
      if (response.data.success) {
        setWishlistItems(response.data.items);
      }
    } catch (error) {
      logger.error('Error fetching wishlist:', error);
      toast.error(t('wishlist.failed_to_fetch', 'Failed to fetch wishlist items'));
    } finally {
      setIsLoading(false);
    }
  };

  // refreshWishlist changes identity on every render; including it would cause an infinite
  // fetch loop. isAuthenticated is the correct sole trigger.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    refreshWishlist();
  }, [isAuthenticated]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Listen for wishlist:refresh events (dispatched after merge-on-login)
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const handler = () => { refreshWishlist(); };
    window.addEventListener('wishlist:refresh', handler);
    return () => window.removeEventListener('wishlist:refresh', handler);
  }, [isAuthenticated]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const isInWishlist = (productId: number): boolean => {
    return wishlistItems.some((item) => item.product_id === productId);
  };

  const addToWishlist = async (productId: number, opts?: WishlistNotifyOpts) => {
    if (!isAuthenticated) {
      // Guest path: fetch product snapshot then persist to localStorage
      try {
        const data = await productService.getProduct(productId);
        const p = data?.product;
        if (!p) {
          toast.error(t('wishlist.product_not_found', 'Product not found'));
          return;
        }

        const guestItem: WishlistItem = {
          id: productId, // synthetic id — equals product_id for guest items
          product_id: productId,
          product: {
            id: p.id,
            name: p.name,
            slug: p.slug ?? '',
            description: p.description ?? '',
            image_url: p.image_url ?? '',
            price: p.price,
            sale_price: p.sale_price ?? null,
            is_on_sale: Boolean(p.is_on_sale),
            discount_percentage: p.discount_percentage ?? 0,
            variants: p.variants ?? { size: '', color: '', style: '' },
          },
        };

        addGuestWishlistItem(guestItem);
        setWishlistItems((prev) => {
          if (prev.some((i) => i.product_id === productId)) return prev;
          return [...prev, guestItem];
        });
        toast.success(t('wishlist.added', 'Added to wishlist'));
      } catch (error) {
        logger.error('Error adding to guest wishlist:', error);
        toast.error(t('wishlist.failed_to_add', 'Failed to add item to wishlist'));
      }
      return;
    }

    // Authenticated path — unchanged
    try {
      setIsLoading(true);
      const body: Record<string, unknown> = {
        product_id: productId,
        notify_price_drop: opts?.notify_price_drop ?? false,
        notify_back_in_stock: opts?.notify_back_in_stock ?? false,
        notes: '',
      };
      if (opts?.target_price !== undefined) {
        body.target_price = opts.target_price;
      }
      const response = await axios.post('/api/wishlist', body);

      if (response.data.success) {
        await refreshWishlist();
        return response.data.item;
      }
    } catch (error: any) {
      logger.error('Error adding to wishlist:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || t('wishlist.already_in_wishlist', 'Item already in wishlist'));
      } else {
        toast.error(t('wishlist.failed_to_add', 'Failed to add item to wishlist'));
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateWishlistNotifications = async (productId: number, opts: WishlistNotifyOpts) => {
    if (!isAuthenticated) {
      // Price-drop / back-in-stock notifications inherently need an account.
      // This is intentional — guests are prompted to sign in.
      toast.error(t('wishlist.login_required', 'Please login to manage your wishlist'));
      return;
    }

    try {
      setIsLoading(true);
      const body: Record<string, unknown> = {
        notify_back_in_stock: opts.notify_back_in_stock ?? false,
        notify_price_drop: opts.notify_price_drop ?? false,
      };
      if (opts.target_price !== undefined) {
        body.target_price = opts.target_price;
      }
      await axios.put(`/api/wishlist/${productId}`, body);
      await refreshWishlist();
    } catch (error: any) {
      logger.error('Error updating wishlist notifications:', error);
      toast.error(error.response?.data?.message || 'Failed to update wishlist notifications');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (!isAuthenticated) {
      // Guest path: remove from localStorage and update state
      removeGuestWishlistItem(productId);
      setWishlistItems((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }

    // Authenticated path — unchanged
    try {
      setIsLoading(true);
      const response = await axios.delete(`/api/wishlist/${productId}`);
      if (response.data.success) {
        await refreshWishlist();
      }
    } catch (error: any) {
      logger.error('Error removing from wishlist:', error);
      toast.error(error.response?.data?.message || 'Failed to remove item from wishlist');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isInWishlist,
        addToWishlist,
        updateWishlistNotifications,
        removeFromWishlist,
        refreshWishlist,
        isLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
