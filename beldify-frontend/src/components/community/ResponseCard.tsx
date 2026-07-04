'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { CommunityResponse, CommunityImage } from '@/types/community';
import { S3_CONFIG } from '@/config/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useDirection } from '@/hooks/useDirection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import logger from '@/utils/consoleLogger';
import { submitSellerReview } from '@/services/communityService';
import toast from '@/utils/toast';
import ResponseForm from './ResponseForm';
import { Pencil } from 'lucide-react';

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
  /** Seller edits their own pending proposal — PATCH /seller/community/responses/{id} */
  onUpdate?: (responseId: string, formData: FormData) => Promise<void>;
  postId?: string | number;
  isSubmitting?: boolean;
}

/** Initials from a shop/seller name — graceful fallback avatar */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Deterministic gradient based on name characters */
function nameToGradient(name: string): string {
  const GRADIENTS = [
    'from-indigo-600 to-indigo-800',
    'from-amber-500 to-amber-700',
    'from-emerald-600 to-emerald-800',
    'from-violet-600 to-violet-800',
    'from-sky-600 to-sky-800',
    'from-rose-600 to-rose-800',
  ];
  const code = name.charCodeAt(0) || 0;
  return GRADIENTS[code % GRADIENTS.length];
}

export default function ResponseCard({
  response,
  isPostOwner,
  onAccept,
  onReject,
  onUpdate,
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
  const [msgExpanded, setMsgExpanded] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // ── Seller review (trust flywheel) ─────────────────────────────────────────
  const [reviewStars, setReviewStars] = useState<number>(response.review?.rating ?? 0);
  const [reviewHover, setReviewHover] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>(response.review?.comment ?? '');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState<boolean>(!!response.review);

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

  // Atlas spec: emerald = accepted, amber = pending, rose = rejected
  const cardRingClass = isAccepted
    ? 'ring-2 ring-emerald-400 bg-emerald-50/20'
    : isRejected
    ? 'ring-1 ring-rose-200 opacity-70'
    : 'ring-1 ring-gray-200 hover:ring-indigo-300';

  const statusBadge = isAccepted ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300">
      <BadgeCheck size={11} className="shrink-0" />
      {t('community.response_status.accepted', 'Accepted')}
    </span>
  ) : isRejected ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-200">
      <X size={11} className="shrink-0" />
      {t('community.response_status.rejected', 'Rejected')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 ring-1 ring-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
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

  // Edit affordance: the OWNING seller may edit their own PENDING proposal
  // while editsRemaining > 0. `editsRemaining` is undefined for legacy
  // responses (pre-edit-cap) — treat missing as unlimited (no cap enforced).
  const isMine = Boolean(response.isMine);
  const editsRemaining = response.editsRemaining;
  const canEdit = Boolean(
    isMine && response.status === 'pending' && (editsRemaining == null || editsRemaining > 0)
  );

  const handleUpdateSubmit = async (formData: FormData) => {
    if (!onUpdate) return;
    setIsUpdating(true);
    try {
      await onUpdate(response.id.toString(), formData);
      setShowEditForm(false);
    } catch (err) {
      logger.error('Error updating response:', err);
      toast.error(t('community.error_updating_response', 'Could not update your proposal. Please try again.'));
    } finally {
      setIsUpdating(false);
    }
  };

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

  // Review gating: the buyer may rate the seller once the deal is complete —
  // no custom order, or the custom order reached delivered/closed.
  const orderStatus = response.customOrder?.status;
  const dealComplete = !response.customOrder || orderStatus === 'delivered' || orderStatus === 'closed';
  const canReview = Boolean(isPostOwner && isAccepted && dealComplete);

  const handleSubmitReview = async () => {
    if (reviewStars < 1) {
      toast.error(t('community.review_pick_rating', 'Please pick a star rating first.'));
      return;
    }
    setReviewSubmitting(true);
    try {
      await submitSellerReview(
        String(currentPostId),
        response.id.toString(),
        reviewStars,
        reviewComment.trim() || undefined
      );
      setReviewDone(true);
      toast.success(t('community.review_thanks', 'Thanks — your review helps other buyers.'));
    } catch (err) {
      logger.error('Error submitting seller review:', err);
      toast.error(t('community.review_error', 'Could not submit your review. Please try again.'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const descText = response.description || '';
  const isLongDesc = descText.length > 200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
      className={`rounded-2xl ${cardRingClass} overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-white`}
    >
      {/* Accepted accent top bar */}
      {isAccepted && (
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
      )}

      <div className="p-5">
        {/* ── Seller header row ─────────────────────────────────── */}
        <div className="flex justify-between items-start mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar with initials fallback — handles null URL and 404 */}
            <div className="relative h-12 w-12 rounded-full overflow-hidden shrink-0 ring-2 ring-gray-200">
              {shopLogo && !logoLoadError ? (
                <Image
                  src={shopLogo}
                  alt={shopName}
                  fill
                  className="object-cover"
                  onError={() => setLogoLoadError(true)}
                />
              ) : (
                <div
                  className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${nameToGradient(shopName)} text-white text-sm font-bold`}
                >
                  {getInitials(shopName)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              {/* Shop name + verified badge */}
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5 truncate">
                {shopName}
                {isVerified && (
                  <BadgeCheck
                    size={14}
                    className="text-indigo-700 shrink-0"
                    aria-label={t('community.verified_seller', 'Verified seller')}
                  />
                )}
              </h3>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {avgRating != null && (
                  <div className="flex items-center gap-0.5">
                    <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                    <span className="text-xs text-gray-600 font-medium">
                      {avgRating.toFixed(1)}
                    </span>
                  </div>
                )}
                {completedJobs != null && (
                  <div className="flex items-center gap-1">
                    <Briefcase size={10} className="text-gray-400 shrink-0" />
                    <span className="text-[11px] text-gray-500">
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

        {/* ── Bid summary strip ─────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-4">
          {response.price != null && response.price > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 rounded-xl ring-1 ring-amber-200">
              <Wallet size={14} className="text-amber-700 shrink-0" />
              <span className="font-bold text-amber-900 text-sm">
                {response.price.toLocaleString()}{' '}
                <span className="font-medium text-amber-700 text-xs">{response.currency || 'MAD'}</span>
              </span>
            </div>
          )}
          {deliveryDays != null && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 rounded-xl ring-1 ring-indigo-100">
              <Clock size={13} className="text-indigo-600 shrink-0" />
              <span className="text-xs text-indigo-700 font-semibold">
                {t('community.delivery_in_days', 'Delivers in {{days}} days', {
                  days: deliveryDays,
                })}
              </span>
            </div>
          )}
        </div>

        {/* ── Cover message ────────────────────────────────────── */}
        <div className="mb-4 bg-gray-50 rounded-xl p-3.5 ring-1 ring-gray-100">
          <p
            className={`text-gray-700 leading-relaxed text-sm whitespace-pre-line ${
              !msgExpanded && isLongDesc ? 'line-clamp-3' : ''
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {descText}
          </p>
          {isLongDesc && (
            <button
              onClick={() => setMsgExpanded((v) => !v)}
              className="mt-2 text-xs text-indigo-700 hover:text-indigo-900 font-medium flex items-center gap-0.5 transition-colors"
            >
              {msgExpanded ? (
                <>
                  {t('common.show_less', 'Show less')} <ChevronUp size={12} />
                </>
              ) : (
                <>
                  {t('common.read_more', 'Read more')} <ChevronDown size={12} />
                </>
              )}
            </button>
          )}
        </div>

        {/* ── Seller skills chips ──────────────────────────────── */}
        {(response.sellerSkills ?? response.seller_skills ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(response.sellerSkills ?? response.seller_skills ?? []).map((skill, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 rounded-full ring-1 ring-indigo-100"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* ── Portfolio images toggle ───────────────────────────── */}
        {response.images && response.images.length > 0 && (
          <div className="mb-4">
            {showImages ? (
              <div>
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-amber-50 mb-2 ring-1 ring-amber-200">
                  <Image
                    src={getImageUrl(
                      (response.images[activeImageIndex] as CommunityImage).image_path
                    )}
                    alt={`${t('community.response_image_alt', 'Response image')} ${activeImageIndex + 1}`}
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
                        aria-label={`${t('community.view_image', 'View image')} ${index + 1}`}
                        className={`relative w-12 h-12 rounded-xl overflow-hidden ring-2 shrink-0 transition-all ${
                          index === activeImageIndex
                            ? 'ring-amber-500'
                            : 'ring-gray-200 hover:ring-gray-300'
                        }`}
                      >
                        <Image
                          src={getImageUrl((image as CommunityImage).image_path)}
                          alt={`${t('community.thumbnail', 'Thumbnail')} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowImages(false)}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <ChevronUp size={12} />
                  {t('community.hide_images', 'Hide images')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowImages(true)}
                className="flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 font-medium transition-colors"
              >
                <ImageIcon size={13} />
                {t('community.view_portfolio', 'View portfolio')} ({response.images.length})
              </button>
            )}
          </div>
        )}

        {/* ── Timestamp ─────────────────────────────────────────── */}
        <div className="text-[11px] text-gray-400">
          {formatDate(response.created_at)}
        </div>

        {/* ── Action buttons ────────────────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap justify-end gap-2.5">
          {/* F4 — Contact Seller: messaging unlocks ONLY after the buyer ACCEPTS a
              proposal (Open Souk locked rule). The affordance therefore renders only
              for the post owner on the accepted proposal — never before acceptance,
              and never for non-owners. */}
          {isPostOwner && isAccepted && shopId && (
            <Link
              href={`/community/messages/${shopId}?postId=${currentPostId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] min-w-[40px] rounded-full bg-white ring-1 ring-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition-colors duration-200"
            >
              <MessagesSquare size={13} />
              {t('community.contact_seller', 'Message')}
            </Link>
          )}

          {/* Accept / Reject — only post owner on pending responses */}
          {isPostOwner && response.status === 'pending' && (
            <>
              <button
                onClick={() => onReject && onReject(response.id.toString())}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-full border border-rose-200 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 transition-colors duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <LoadingSpinner className="h-3.5 w-3.5" />
                ) : (
                  <X size={13} />
                )}
                {t('community.reject_offer', 'Decline')}
              </button>
              <button
                onClick={handleAccept}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[40px] rounded-full bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors duration-200 disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? (
                  <LoadingSpinner className="h-3.5 w-3.5" />
                ) : (
                  <Check size={13} />
                )}
                {t('community.accept_offer', 'Hire')}
              </button>
            </>
          )}

          {/* Edit proposal — owning seller only, while pending + edits remain */}
          {canEdit && !showEditForm && (
            <div className="flex items-center gap-2">
              {editsRemaining != null && (
                <span className="text-[11px] text-gray-400">
                  {t('community.edits_left', '{{count}} edits left', { count: editsRemaining })}
                </span>
              )}
              <button
                onClick={() => setShowEditForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-full border border-indigo-200 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 transition-colors duration-200"
              >
                <Pencil size={13} />
                {t('community.edit_proposal', 'Edit proposal')}
              </button>
            </div>
          )}
        </div>

        {/* ── Edit proposal form (inline) ───────────────────────────────── */}
        {canEdit && showEditForm && (
          <div className="mt-4 -mx-5 -mb-5 rounded-b-2xl overflow-hidden">
            <ResponseForm
              mode="edit"
              isLoading={isUpdating}
              onCancel={() => setShowEditForm(false)}
              onSubmit={handleUpdateSubmit}
              initialData={{
                description: response.description,
                price: response.price,
                currency: response.currency,
                delivery_days: response.delivery_days ?? response.deliveryDays,
                sellerSkills: response.sellerSkills ?? response.seller_skills,
              }}
            />
          </div>
        )}

        {/* ── Seller review (buyer, post-delivery) ──────────────────────── */}
        {isPostOwner && isAccepted && (reviewDone || canReview) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {reviewDone ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">
                  {t('community.your_rating', 'Your rating')}:
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={15}
                      className={
                        n <= reviewStars
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
                <span className="text-[11px] text-emerald-700 font-medium ms-1">
                  {t('community.review_submitted', 'Review submitted')}
                </span>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  {t('community.rate_seller_prompt', 'How was working with this seller?')}
                </p>
                <div className="flex items-center gap-1 mb-3" role="radiogroup" aria-label={t('community.rate_seller_prompt', 'Rate this seller')}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} ${t('community.stars', 'stars')}`}
                      onClick={() => setReviewStars(n)}
                      onMouseEnter={() => setReviewHover(n)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        size={22}
                        className={
                          n <= (reviewHover || reviewStars)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-gray-300'
                        }
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder={t('community.review_comment_placeholder', 'Share a few words (optional)…')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className="w-full text-sm rounded-xl bg-gray-50 ring-1 ring-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting || reviewStars < 1}
                  className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[40px] rounded-full bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 transition-colors duration-200 disabled:opacity-50 shadow-sm"
                >
                  {reviewSubmitting ? (
                    <LoadingSpinner className="h-3.5 w-3.5" />
                  ) : (
                    <Star size={13} />
                  )}
                  {t('community.submit_review', 'Submit review')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
