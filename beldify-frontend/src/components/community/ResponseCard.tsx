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
  Wallet,
  BadgeCheck,
  Star,
  Clock,
  Briefcase,
} from 'lucide-react';
import type { CommunityResponse, CommunityImage } from '@/types/community';
import { S3_CONFIG } from '@/config/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useDirection } from '@/hooks/useDirection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import logger from '@/utils/consoleLogger';

// Inline seller mini-profile shape from PostResponseResource.buildSellerProfile()
interface SellerProfile {
  id: string;
  name?: string;
  avatar?: string | null;
  shop?: {
    id: string;
    name: string;
    slug?: string | null;
    logo?: string | null;
    isVerified?: boolean;
  } | null;
  avgRating?: number | null;
  completedJobs?: number | null;
  totalProposals?: number | null;
  responseRate?: number | null;
  memberSince?: string | null;
}

interface ResponseCardProps {
  response: CommunityResponse & { seller?: SellerProfile };
  isPostOwner?: boolean;
  onAccept?: (responseId: string) => void;
  onReject?: (responseId: string) => void;
  postId?: string | number;
  isSubmitting?: boolean;
}

export default function ResponseCard({
  response,
  isPostOwner,
  onAccept,
  onReject,
  postId,
  isSubmitting = false,
}: ResponseCardProps) {
  const { user } = useAuth();
  const params = useParams();
  const currentPostId = postId || params?.id;
  const { t } = useTranslation();
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
      return (
        new Date(dateString).toLocaleDateString() +
        ' ' +
        new Date(dateString).toLocaleTimeString()
      );
    } catch (error) {
      logger.error('Error formatting date:', error);
      return dateString;
    }
  };

  const isAccepted = response.status === 'accepted';
  const isRejected = response.status === 'rejected';

  // Atlas spec: emerald = accepted/completed, amber = pending/open, rose = rejected
  const cardRingClass = isAccepted
    ? 'ring-2 ring-emerald-500 bg-emerald-50/30'
    : isRejected
    ? 'ring-1 ring-rose-200 opacity-75'
    : 'ring-1 ring-amber-200 hover:ring-amber-300';

  const statusBadge = isAccepted ? (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300">
      <BadgeCheck size={12} className="shrink-0" />
      {t('community.response_status.accepted', 'Accepted')}
    </span>
  ) : isRejected ? (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-rose-200">
      <X size={12} className="shrink-0" />
      {t('community.response_status.rejected', 'Rejected')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ring-1 ring-amber-200">
      {t('community.response_status.pending', 'Pending')}
    </span>
  );

  // Resolve seller mini-profile: prefer the dedicated `seller` object from
  // PostResponseResource.buildSellerProfile(), fall back to legacy `shop`.
  const seller = (response as ResponseCardProps['response']).seller;
  const shopName =
    seller?.shop?.name ??
    response.shop?.name ??
    response.shopName ??
    response.userName ??
    t('community.seller', 'Seller');
  const shopLogo =
    seller?.shop?.logo ?? (typeof response.shop?.logo === 'string' ? response.shop.logo : null);
  const isVerified = seller?.shop?.isVerified ?? response.shop?.isVerified ?? false;
  const shopId = seller?.shop?.id ?? response.shopId ?? response.shop?.id;

  // Stats from inline seller profile
  const avgRating =
    seller?.avgRating != null
      ? seller.avgRating
      : typeof response.shop?.rating === 'number'
      ? response.shop.rating
      : null;
  const completedJobs = seller?.completedJobs ?? null;

  // Delivery days from response
  const deliveryDays = response.delivery_days ?? response.deliveryDays ?? null;

  const handleAccept = () => {
    if (
      window.confirm(
        t(
          'community.confirm_accept_proposal',
          'Accept this proposal? The job will move to In Progress.'
        )
      )
    ) {
      onAccept && onAccept(response.id.toString());
    }
  };

  return (
    <div
      className={`rounded-2xl ${cardRingClass} overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative`}
    >
      <div className="p-5">
        {/* Seller header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative h-14 w-14 rounded-full overflow-hidden bg-indigo-50 shrink-0 ring-2 ring-amber-300">
              {shopLogo ? (
                <Image
                  src={shopLogo}
                  alt={shopName}
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
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-1.5">
                {shopName}
                {isVerified && (
                  <BadgeCheck size={15} className="text-indigo-700 shrink-0" aria-label="Verified seller" />
                )}
              </h3>

              {/* Inline stats row */}
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {avgRating != null && (
                  <div className="flex items-center gap-1">
                    <Star size={11} className="text-amber-500 fill-amber-500" />
                    <span className="text-xs text-gray-700 font-medium">
                      {avgRating.toFixed(1)}
                    </span>
                  </div>
                )}
                {completedJobs != null && (
                  <div className="flex items-center gap-1">
                    <Briefcase size={11} className="text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {t('community.completed_jobs', '{{count}} jobs done', {
                        count: completedJobs,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {statusBadge}
        </div>

        {/* Proposal cover text */}
        <div className="mb-4">
          <p className="text-gray-800 leading-relaxed whitespace-pre-line text-sm">
            {response.description}
          </p>
        </div>

        {/* Price + Delivery row */}
        <div className="flex flex-wrap gap-3 mb-4">
          {response.price && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 rounded-2xl ring-1 ring-amber-200">
              <Wallet size={15} className="text-amber-700 shrink-0" />
              <span className="currency-mad font-semibold text-amber-900 text-sm">
                {response.price.toLocaleString()} {response.currency || 'MAD'}
              </span>
            </div>
          )}
          {deliveryDays != null && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 rounded-2xl ring-1 ring-indigo-100">
              <Clock size={14} className="text-indigo-600 shrink-0" />
              <span className="text-sm text-indigo-700 font-medium">
                {t('community.delivery_in_days', 'Delivers in {{days}} days', {
                  days: deliveryDays,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Seller skills chips */}
        {(response.sellerSkills ?? response.seller_skills ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(response.sellerSkills ?? response.seller_skills ?? []).map((skill, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 rounded-full ring-1 ring-indigo-100"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Response Images */}
        {response.images && response.images.length > 0 && (
          <div className="mt-3">
            {showImages ? (
              <div className="mb-3">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-amber-50 mb-2 ring-1 ring-amber-200">
                  <Image
                    src={getImageUrl(
                      (response.images[activeImageIndex] as CommunityImage).image_path
                    )}
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
                          index === activeImageIndex
                            ? 'ring-amber-500'
                            : 'ring-amber-200'
                        }`}
                      >
                        <Image
                          src={getImageUrl((image as CommunityImage).image_path)}
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
                  {t('community.hide_images', 'Hide images')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowImages(true)}
                className="flex items-center gap-1 text-sm text-indigo-700 hover:text-indigo-800"
              >
                <ImageIcon size={14} />
                {t('community.view_images', 'View images')} ({response.images.length})
              </button>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-3 text-xs text-gray-400">
          {formatDate(response.created_at)}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-amber-100 flex flex-wrap justify-end gap-3">
          {/* Contact Seller */}
          {shopId && (
            <Link
              href={`/community/messages/${shopId}?postId=${currentPostId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] min-w-[44px] rounded-full bg-white ring-1 ring-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition-colors duration-200"
            >
              <MessagesSquare size={14} />
              {t('community.contact_seller', 'Message')}
            </Link>
          )}

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
                {t('community.reject_offer', 'Decline')}
              </button>
              <button
                onClick={handleAccept}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-full bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  <Check size={14} />
                )}
                {t('community.accept_offer', 'Hire')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
