'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  isInWishlist: (productId: number) => boolean;
  addToWishlist: (productId: number) => Promise<void>;
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

  const refreshWishlist = async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
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
      toast.error('Failed to fetch wishlist items');
    } finally {
      setIsLoading(false);
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
      toast.error('Please login to add items to your wishlist');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('/api/wishlist', {
        product_id: productId,
        notify_price_drop: false,
        notify_back_in_stock: false,
        notes: '',
      });

      if (response.data.success) {
        await refreshWishlist();
        return response.data.item;
      }
    } catch (error: any) {
      logger.error('Error adding to wishlist:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Item already in wishlist');
      } else {
        toast.error('Failed to add item to wishlist');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (!isAuthenticated) {
      toast.error('Please login to manage your wishlist');
      return;
    }

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
