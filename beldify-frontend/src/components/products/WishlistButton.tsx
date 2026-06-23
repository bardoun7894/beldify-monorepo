'use client';

import { useState } from 'react';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useWishlist } from '@/contexts/WishlistContext';
import { useTranslation } from 'react-i18next';
import toast from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import logger from '@/utils/consoleLogger'; 
interface WishlistButtonProps {
  productId: number;
  className?: string;
  showText?: boolean;
  onSuccess?: () => void;
}

export default function WishlistButton({
  productId,
  className = '',
  showText = false,
  onSuccess,
}: WishlistButtonProps) {
  const { t } = useTranslation();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLiked = isAuthenticated && isInWishlist(productId);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    if (!isAuthenticated) {
      toast.error(t('auth.login_required'));
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    try {
      setIsLoading(true);

      if (isLiked) {
        await removeFromWishlist(productId);
        toast.success(t('wishlist.removed_success'));
      } else {
        await addToWishlist(productId);
        toast.success(t('wishlist.added_success'));
      }

      onSuccess?.();
    } catch (error: any) {
        logger.error('Error toggling wishlist:', error);
      // Extract error message from response or use default
      const errorMessage = error.response?.data?.message || t('errors.something_went_wrong');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className={`${className} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} flex items-center gap-2`}
      aria-label={isLiked ? t('wishlist.remove') : t('wishlist.add')}
    >
      {isLiked ? (
        <HeartSolid className="h-5 w-5 text-red-500" />
      ) : (
        <HeartOutline className="h-5 w-5" />
      )}
      {showText && (
        <span className="text-sm">{isLiked ? t('wishlist.remove') : t('wishlist.add')}</span>
      )}
    </button>
  );
}
