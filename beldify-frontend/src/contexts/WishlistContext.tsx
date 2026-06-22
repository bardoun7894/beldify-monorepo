'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import axios from '@/lib/axios';
import toast from '@/utils/toast';
import logger from '@/utils/consoleLogger';

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

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  isInWishlist: (productId: number) => boolean;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  refreshWishlist: (opts?: { silent?: boolean }) => Promise<void>;
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

  const refreshWishlist = async (opts: { silent?: boolean } = {}) => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      setIsLoading(false);
      return;
    }

    try {
      // `silent` lets mutations (add/remove) reconcile with the server in the
      // background without toggling the global loading flag — otherwise the
      // wishlist page swaps to its skeleton on every action.
      if (!opts.silent) setIsLoading(true);
      const response = await axios.get('/api/wishlist');
      if (response.data.success) {
        setWishlistItems(response.data.items);
      }
    } catch (error) {
      logger.error('Error fetching wishlist:', error);
      if (!opts.silent) {
        toast.error(t('wishlist.toasts.fetch_failed'));
      }
    } finally {
      if (!opts.silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, [isAuthenticated]);

  const isInWishlist = (productId: number): boolean => {
    return wishlistItems.some((item) => item.product_id === productId);
  };

  const addToWishlist = async (productId: number) => {
    if (!isAuthenticated) {
      toast.error(t('wishlist.toasts.login_required_add'));
      return;
    }

    try {
      const response = await axios.post('/api/wishlist', {
        product_id: productId,
        notify_price_drop: false,
        notify_back_in_stock: false,
        notes: '',
      });

      if (response.data.success) {
        // Background refresh — don't toggle isLoading so the wishlist page
        // (which uses isLoading to show its skeleton) doesn't flicker on each mutation.
        await refreshWishlist({ silent: true });
        return response.data.item;
      }
    } catch (error: any) {
      logger.error('Error adding to wishlist:', error);
      if (error.response?.status === 400) {
        toast.error(t('wishlist.toasts.already_in_wishlist'));
      } else {
        toast.error(t('wishlist.toasts.add_failed'));
      }
      throw error;
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (!isAuthenticated) {
      toast.error(t('wishlist.toasts.login_required_manage'));
      return;
    }

    // Optimistic update — drop the item locally so the grid doesn't flicker
    // through the parent page's isLoading skeleton during the API round-trip.
    const previousItems = wishlistItems;
    setWishlistItems((prev) => prev.filter((item) => item.product_id !== productId));

    try {
      const response = await axios.delete(`/api/wishlist/${productId}`);
      if (response.data.success) {
        // Reconcile with the server quietly; surface any drift.
        await refreshWishlist({ silent: true });
      } else {
        // Server rejected without throwing — revert.
        setWishlistItems(previousItems);
      }
    } catch (error: any) {
      logger.error('Error removing from wishlist:', error);
      setWishlistItems(previousItems);
      toast.error(t('wishlist.toasts.remove_failed'));
      throw error;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        // Derived count for navbar / bottom-nav badges. Kept here so consumers
        // don't all reimplement `wishlistItems?.length || 0`.
        wishlistCount: wishlistItems?.length || 0,
        isInWishlist,
        addToWishlist,
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
