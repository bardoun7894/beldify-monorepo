'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ImageIcon,
  X,
  Check,
  MessagesSquare,
  Store,
  Send,
  Wallet,
  BadgeCheck,
  Star,
  Sparkles
} from 'lucide-react';
import type { CommunityResponse, CommunityImage } from '@/types/community';
import { S3_CONFIG } from '@/config/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useDirection } from '@/hooks/useDirection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import logger from '@/utils/consoleLogger';

interface ProductOffer {
  id: string | number;
  name: string;
  price: number;
  currency: string;
  image?: string;
}
interface ResponseCardProps {
  response: CommunityResponse;
  isPostOwner?: boolean;
  onAccept?: (responseId: string) => void;
  onReject?: (responseId: string) => void;
  postId?: string | number;
  isSubmitting?: boolean;
}

export default function ResponseCard({ response, isPostOwner, onAccept, onReject, postId, isSubmitting = false }: ResponseCardProps) {
  const { user } = useAuth();
  const params = useParams();
  const currentPostId = postId || params?.id;
  const { t, i18n } = useTranslation();
  const { isRTL } = useDirection();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImages, setShowImages] = useState(false);

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return '/images/placeholder.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `${S3_CONFIG.BASE_URL}/${imagePath}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const localeMap: Record<string, string> = { en: 'en-US', fr: 'fr-FR', ar: 'ar-MA', ma: 'ar-MA', es: 'es-ES' };
      const bcp47 = localeMap[i18n.language] || 'fr-FR';
      return new Date(dateString).toLocaleDateString(bcp47) + ' ' + new Date(dateString).toLocaleTimeString(bcp47);
    } catch (error) {
      logger.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Accepted: amber ring; Rejected: rose border
  const isAccepted = response.status === 'accepted';
  const isRejected = response.status === 'rejected';

  const cardRingClass = isAccepted
    ? 'ring-2 ring-amber-500'
    : 'ring-1 ring-amber-200 hover:ring-amber-300';

  const statusBadge = isAccepted ? (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ring-1 ring-amber-300">
      <BadgeCheck size={12} className="shrink-0" />
      {t('community.response_status.accepted')}
    </span>
  ) : isRejected ? (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-rose-200">
      <X size={12} className="shrink-0" />
      {t('community.response_status.rejected')}
    </span>
  ) : null;

  return (
    <div className={`bg-amber-50/40 rounded-2xl ${cardRingClass} overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative`}>
      <div className="p-5">
        {/* Seller header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            {/* Avatar */}
            <div className="relative h-14 w-14 rounded-full overflow-hidden bg-indigo-50 mr-4 ring-1 ring-amber-200">
              {response.shop?.logo && typeof response.shop.logo === 'string' ? (
                <Image
                  src={response.shop.logo}
                  alt={response.shop?.name || response.shopName || t('community.seller_shop')}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-indigo-50 text-indigo-700">
                  <Store size={24} />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-1">
                {response.shop?.name || response.shopName || response.userName || t('community.seller')}
                {(response.shop?.isVerified || true) && (
                  <BadgeCheck size={16} className="text-indigo-700 shrink-0" />
                )}
              </h3>
              {/* Seller-side AI chip */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">
                  <Star size={12} className="text-amber-500 mr-1" />
                  <span className="text-sm text-gray-700 font-medium">4.9</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-700 text-white text-[10px] font-medium">
                  <Sparkles size={10} className="shrink-0" />
                  {t('ai.chip.photoEnhance', 'AI photo enhance')}
                </span>
              </div>
            </div>
          </div>

          {statusBadge}
        </div>

        {/* Response Content */}
        <div className="mb-4">
          <p className="text-gray-800 whitespace-pre-line">{response.description}</p>
        </div>

        {/* Price Offer */}
        {response.price && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 rounded-2xl ring-1 ring-amber-200">
            <Wallet size={16} className="text-amber-700 shrink-0" />
            <span className="font-medium text-amber-800">
              {response.price} {response.currency || 'MAD'}
            </span>
          </div>
        )}

        {/* Response Images */}
        {response.images && response.images.length > 0 && (
          <div className="mt-3">
            {showImages ? (
              <div className="mb-3">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-amber-50 mb-2 ring-1 ring-amber-200">
                  <Image
                    src={getImageUrl(response.images[activeImageIndex].image_path)}
                    alt={`Response image ${activeImageIndex + 1}`}
                    fill
                    className="object-contain"
                  />
                </div>

                {response.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {response.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`relative w-12 h-12 rounded-xl overflow-hidden ring-2 ${
                          index === activeImageIndex ? 'ring-amber-500' : 'ring-amber-200'
                        }`}
                      >
                        <Image
                          src={getImageUrl(image.image_path)}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowImages(false)}
                  className="text-xs text-gray-600 hover:text-gray-800 mt-1"
                >
                  {t('community.hide_images')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowImages(true)}
                className="flex items-center gap-1 text-sm text-indigo-700 hover:text-indigo-800"
              >
                <ImageIcon size={14} />
                {t('community.view_images')} ({response.images.length})
              </button>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-3 font-mono text-[10px] tracking-[0.2em] uppercase text-gray-600">
          {formatDate(response.created_at)}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-amber-100 flex flex-wrap justify-end gap-3">
          {/* Contact Seller */}
          <Link
            href={`/community/messages/${response.shopId || response.shop?.id}?postId=${currentPostId}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] min-w-[44px] rounded-full bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 transition-colors duration-200"
          >
            <MessagesSquare size={14} />
            {t('community.contact_seller')}
          </Link>

          {/* Accept / Reject — only post owner on pending responses */}
          {isPostOwner && response.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={() => onReject && onReject(response.id.toString())}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full border border-rose-200 text-sm font-medium text-rose-700 bg-white hover:bg-rose-50 transition-colors duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  <X size={14} className="text-rose-700" />
                )}
                {t('community.reject_offer')}
              </button>
              <button
                onClick={() => onAccept && onAccept(response.id.toString())}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full bg-indigo-700 text-white text-sm font-medium hover:bg-indigo-800 transition-colors duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  <Check size={14} />
                )}
                {t('community.accept_offer')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
