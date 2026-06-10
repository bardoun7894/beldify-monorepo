'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Wallet,
  MessagesSquare,
  Tag,
  Wrench,
  ChevronDown,
  ChevronUp,
  Package,
  Gem,
  Users,
  AlertCircle,
  CheckCircle2,
  LogIn,
  Store,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/utils/authUtils';
import { useDirection } from '@/hooks/useDirection';
import logger from '@/utils/consoleLogger';
import toast from '@/utils/toast';
import {
  fetchCommunityPost,
  fetchPostResponses,
  updateResponseStatus,
} from '@/services/communityService';
import { CommunityPost, CommunityResponse, CommunityImage } from '@/types/community';
import { S3_CONFIG, API_BASE_URL } from '@/config/constants';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ResponseCard from '@/components/community/ResponseCard';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

/** Initials from a name — fallback avatar */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Deterministic indigo-to-amber gradient */
function nameToGradient(name: string): string {
  const GRADIENTS = [
    'from-indigo-500 to-indigo-700',
    'from-amber-500 to-amber-700',
    'from-emerald-500 to-emerald-700',
    'from-violet-500 to-violet-700',
  ];
  const code = name.charCodeAt(0) || 0;
  return GRADIENTS[code % GRADIENTS.length];
}

function timeAgo(dateString: string, isRTL: boolean): string {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: isRTL ? ar : undefined,
    });
  } catch {
    return dateString;
  }
}

export default function PostDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const loadAuthToken = async () => {
      const token = await getAuthToken();
      setAuthToken(token);
    };
    loadAuthToken();
  }, []);

  const { isRTL } = useDirection();
  const rawId = params?.id as string;
  const postId = rawId.includes('-') ? rawId.split('-')[0] : rawId;

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [responses, setResponses] = useState<CommunityResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [buyerAvatarError, setBuyerAvatarError] = useState(false);
  // F5: once accept is called, show a "View your custom order" CTA
  const [acceptedCustomOrderId, setAcceptedCustomOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (!postId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        };

        const postResponse = await fetch(
          `${API_BASE_URL}/api/v1/community/posts/${postId}`,
          { headers, credentials: 'include' }
        );

        if (!postResponse.ok) {
          const errorData = await postResponse.json().catch(() => ({}));
          throw new Error(errorData.message || t('community.error_failed_to_fetch_post'));
        }

        const postResult = await postResponse.json();

        if (postResult.data) {
          setPost(postResult.data);

          try {
            const responsesResponse = await fetch(
              `${API_BASE_URL}/api/v1/community/posts/${postId}/responses`,
              { headers, credentials: 'include' }
            );

            if (!responsesResponse.ok) {
              logger.warn('Failed to fetch responses, continuing without them');
              setResponses([]);
            } else {
              const responsesResult = await responsesResponse.json();
              setResponses(responsesResult.data || []);
            }
          } catch (responseError) {
            logger.error('Error fetching responses:', responseError);
            setResponses([]);
          }
        } else {
          throw new Error(t('community.error_invalid_post_data'));
        }
      } catch (err) {
        logger.error('Error in fetchData:', err);
        setError(
          err instanceof Error
            ? err.message
            : t('community.error_fetching_post') || 'Failed to load post details'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [postId, t, authToken]);

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return '/images/placeholder.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `${S3_CONFIG.BASE_URL}/${imagePath}`;
  };

  const handleAcceptResponse = async (responseId: number) => {
    const postUserId = post?.userId || post?.user?.id;
    if (!post || postUserId !== Number(user?.id)) {
      toast.error(t('community.not_authorized', 'You are not authorized to perform this action'));
      return;
    }

    try {
      setIsSubmitting(true);
      // F5: accept returns {success:true} — no custom_order_id yet (OS-P1-8 deferred).
      const result: any = await updateResponseStatus(postId, responseId.toString(), 'accepted');
      if (result?.custom_order_id) {
        setAcceptedCustomOrderId(result.custom_order_id);
      } else {
        // Signal that acceptance happened so we can show the CTA
        setAcceptedCustomOrderId(0);
      }
      const updatedPostData = await fetchCommunityPost(postId);
      setPost(updatedPostData);
      const updatedResponsesData = await fetchPostResponses(postId);
      setResponses(updatedResponsesData || []);
    } catch (err) {
      logger.error('Error accepting response:', err);
      toast.error(t('community.error_accepting_response', 'Could not accept the response. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectResponse = async (responseId: number) => {
    const postUserId = post?.userId || post?.user?.id;
    if (!post || postUserId !== Number(user?.id)) {
      toast.error(t('community.not_authorized', 'You are not authorized to perform this action'));
      return;
    }

    try {
      setIsSubmitting(true);
      await updateResponseStatus(postId, responseId.toString(), 'rejected');
      const updatedPostData = await fetchCommunityPost(postId);
      setPost(updatedPostData);
      const updatedResponsesData = await fetchPostResponses(postId);
      setResponses(updatedResponsesData || []);
    } catch (err) {
      logger.error('Error rejecting response:', err);
      toast.error(t('community.error_rejecting_response', 'Could not reject the response. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-950 flex items-center justify-center">
            <LoadingSpinner className="h-6 w-6 text-amber-400" />
          </div>
          <p className="text-sm text-gray-500">{t('common.loading', 'Loading…')}</p>
        </div>
      </div>
    );
  }

  // ── Error / not found ─────────────────────────────────────────────────────
  if (error || !post) {
    return (
      <div className="min-h-screen bg-canvas py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-white rounded-2xl p-8 ring-1 ring-rose-200">
              <AlertCircle size={32} className="text-rose-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-3 text-gray-900">
                {t('community.post_not_found')}
              </h2>
              <p className="mb-6 text-rose-700 text-sm">{error || t('community.post_may_not_exist')}</p>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] text-sm font-semibold text-white bg-indigo-700 rounded-full hover:bg-indigo-800 transition-colors duration-200"
              >
                <ArrowLeft size={16} />
                {t('community.back_to_community')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMyPost = Number(user?.id) === (post.userId || post.user?.id);
  const postIsOpen = post.status === 'open';

  // hasMyProposal guard — backend 422s a second submit, so hide the form
  const hasMyProposal = post.hasMyProposal ?? post.has_my_proposal ?? false;

  // F4: only store owners / sellers can respond. `store_owner` is the canonical
  // seller role (see project memory beldify-seller-role-model); legacy `seller`,
  // is_seller, and user_type_id===2 are kept for backward compatibility.
  const isSeller =
    user?.role === 'store_owner' ||
    user?.role === 'seller' ||
    (user as any)?.is_store_owner === true ||
    (user as any)?.is_seller === true ||
    user?.user_type_id === 2;

  // F3: normalise product_specifications
  const rawSpecs = (post as any).product_specifications ?? (post as any).productSpecifications;
  const productSpecs: Record<string, string> | null =
    rawSpecs && typeof rawSpecs === 'object' && !Array.isArray(rawSpecs)
      ? rawSpecs
      : null;
  const productColors: string[] = post.colors ?? [];
  const productStyles: string[] = post.styles ?? [];

  const statusSteps: Array<{ key: string; label: string }> = [
    { key: 'open', label: t('community.status.open', 'Open') },
    { key: 'in_progress', label: t('community.status.in_progress', 'In Progress') },
    { key: 'completed', label: t('community.status.completed', 'Completed') },
  ];
  const currentStepIndex = statusSteps.findIndex(s => s.key === post.status);

  const statusPillClass =
    post.status === 'open'
      ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
      : post.status === 'in_progress'
      ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'
      : 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200';

  const statusDot =
    post.status === 'open'
      ? 'bg-amber-500 animate-pulse'
      : post.status === 'in_progress'
      ? 'bg-indigo-500'
      : 'bg-emerald-500';

  const requiredSkills = post.requiredSkills ?? post.required_skills ?? [];

  const buyerName = post.buyer?.name ?? post.userName ?? post.user?.name ?? '';
  const buyerAvatar = post.buyer?.avatar ?? post.userAvatar ?? post.user?.avatar ?? null;

  const proposalCount =
    post.proposalCount ?? post.proposal_count ?? responses.length;

  const postedAt = post.created_at ?? post.createdAt;

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Editorial header band ─────────────────────────────────────── */}
      <div className="bg-indigo-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white text-sm font-medium transition-colors duration-200"
          >
            <ArrowLeft size={15} />
            {t('openSouk.brand', 'Open Souk')}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Job header card ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden mb-6 shadow-sm"
        >
          {/* Top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-indigo-600" />

          <div className="p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Left: title + meta */}
              <div className="flex-1 min-w-0">
                {/* Status + category */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusPillClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`} />
                    {t(`community.status.${post.status}`, post.status)}
                  </span>
                  {post.category && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                      <Tag size={10} />
                      {isRTL
                        ? (post.category as any).name_ar ?? post.category.name
                        : post.category.name}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1
                  className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {post.title}
                </h1>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                  {postedAt && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-gray-400" />
                      {timeAgo(postedAt, isRTL)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users size={11} className="text-gray-400" />
                    {proposalCount} {t('community.proposals', 'proposals')}
                  </span>
                </div>
              </div>

              {/* Right: budget + deadline */}
              <div className="flex flex-col gap-2.5 sm:items-end shrink-0">
                {((post.budget_min && post.budget_max) || post.budget) && (
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 rounded-2xl ring-1 ring-amber-200">
                    <Wallet size={15} className="text-amber-700 shrink-0" />
                    <div>
                      <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wide">
                        {t('community.budget_label', 'Budget')}
                      </p>
                      <span className="currency-mad text-sm font-bold text-amber-900">
                        {post.budget
                          ? `${post.budget.min} – ${post.budget.max} ${post.budget.currency}`
                          : `${post.budget_min} – ${post.budget_max} ${post.currency || 'MAD'}`}
                      </span>
                    </div>
                  </div>
                )}
                {post.timeline && (
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 rounded-2xl ring-1 ring-indigo-100">
                    <Clock size={14} className="text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wide">
                        {t('community.timeline_label', 'Timeline')}
                      </p>
                      <span className="text-sm font-semibold text-indigo-800">{post.timeline}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Buyer info */}
            {buyerName && (
              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-amber-200 shrink-0 relative bg-amber-50">
                  {buyerAvatar && !buyerAvatarError ? (
                    <Image
                      src={getImageUrl(buyerAvatar)}
                      alt={buyerName}
                      fill
                      className="object-cover"
                      onError={() => setBuyerAvatarError(true)}
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${nameToGradient(buyerName)}`}
                    >
                      <span className="text-xs font-bold text-white">{getInitials(buyerName)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {buyerName}
                    {isMyPost && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                        {t('common.you', 'You')}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {t('community.posted_by', 'Posted by')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Two-column grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">

          {/* ── LEFT COLUMN: Job detail ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05, ease: [0.25, 1, 0.5, 1] }}
            className="space-y-4"
          >
            {/* Images gallery */}
            {post.images && post.images.length > 0 && (
              <div className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {t('community.reference_images', 'Reference Images')}
                  </h2>
                </div>
                <div className="p-5">
                  <div className="relative w-full aspect-[4/3] bg-amber-50 rounded-2xl overflow-hidden mb-3 group ring-1 ring-amber-200">
                    <Image
                      src={getImageUrl(
                        typeof post.images[activeImageIndex] === 'string'
                          ? (post.images[activeImageIndex] as string)
                          : (post.images[activeImageIndex] as CommunityImage).image_path
                      )}
                      alt={`${post.title} — ${t('community.post_image_alt_suffix')} ${activeImageIndex + 1}`}
                      fill
                      className="object-contain transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                    />
                    <div className="absolute bottom-3 end-3 bg-indigo-950/70 text-white px-2.5 py-1 rounded-full text-xs backdrop-blur-sm">
                      {activeImageIndex + 1} / {post.images.length}
                    </div>
                  </div>

                  {post.images.length > 1 && (
                    <div className="flex overflow-x-auto gap-2 pb-1">
                      {post.images.map((image, index) => (
                        <button
                          key={index}
                          aria-label={`${t('community.view_image', 'View image')} ${index + 1}`}
                          className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 transition-all duration-200 ring-2 ${
                            activeImageIndex === index
                              ? 'ring-amber-500'
                              : 'ring-gray-200 hover:ring-gray-300'
                          }`}
                          onClick={() => setActiveImageIndex(index)}
                        >
                          <Image
                            src={getImageUrl(
                              typeof image === 'string'
                                ? image
                                : (image as CommunityImage).image_path
                            )}
                            alt={`${t('community.post_thumbnail_alt_suffix')} ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">
                  {t('community.description', 'Description')}
                </h2>
              </div>
              <div className="p-5">
                <p
                  className={`text-gray-700 leading-relaxed text-sm whitespace-pre-line ${
                    !descExpanded ? 'line-clamp-6' : ''
                  }`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {post.description}
                </p>
                {post.description && post.description.length > 350 && (
                  <button
                    onClick={() => setDescExpanded(v => !v)}
                    className="mt-3 text-xs text-indigo-700 hover:text-indigo-900 font-medium flex items-center gap-0.5 transition-colors"
                  >
                    {descExpanded ? (
                      <>{t('common.show_less', 'Show less')} <ChevronUp size={12} /></>
                    ) : (
                      <>{t('common.show_more', 'Show more')} <ChevronDown size={12} /></>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* F3: Custom-piece specifications */}
            {productSpecs && Object.keys(productSpecs).length > 0 && (
              <div className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Gem size={13} className="text-amber-600" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    {t('community.product_specifications', 'Specifications')}
                  </h2>
                </div>
                <div className="p-5">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {Object.entries(productSpecs)
                      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-[10px] uppercase tracking-wide text-amber-700 font-semibold mb-0.5">
                            {key.replace(/_/g, ' ')}
                          </dt>
                          <dd className="text-sm font-semibold text-gray-800">
                            {String(value)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>
              </div>
            )}

            {/* Skills, colors, styles — combined */}
            {(requiredSkills.length > 0 || productColors.length > 0 || productStyles.length > 0) && (
              <div className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Wrench size={13} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    {t('community.requirements', 'Requirements')}
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  {requiredSkills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        {t('community.required_skills', 'Required skills')}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {requiredSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full ring-1 ring-indigo-100"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {productColors.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        {t('community.colors', 'Colors')}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {productColors.map((color, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-800 rounded-full ring-1 ring-amber-200"
                          >
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {productStyles.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        {t('community.styles', 'Styles')}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {productStyles.map((style, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full ring-1 ring-indigo-100"
                          >
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lifecycle stepper */}
            <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-4">
                {t('community.job_progress', 'Progress')}
              </p>
              <div className="flex items-center gap-2">
                {statusSteps.map((step, index) => {
                  const isCompleted = currentStepIndex > index;
                  const isActive = currentStepIndex === index;
                  return (
                    <div key={step.key} className="flex items-center gap-2 flex-1">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                            isCompleted
                              ? 'bg-indigo-700 text-white'
                              : isActive
                              ? 'bg-indigo-700 text-white ring-2 ring-offset-1 ring-gray-300'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 size={14} /> : index + 1}
                        </div>
                        <span
                          className={`text-[9px] tracking-[0.12em] uppercase whitespace-nowrap font-semibold ${
                            isActive
                              ? 'text-indigo-700'
                              : isCompleted
                              ? 'text-gray-600'
                              : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mb-[18px] transition-all ${
                            isCompleted ? 'bg-indigo-700' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT COLUMN: Proposals + form ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
            className="space-y-4"
          >
            {/* F5: Post-accept CTA — "View your custom order" */}
            <AnimatePresence>
              {acceptedCustomOrderId !== null && isMyPost && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 rounded-2xl ring-2 ring-emerald-300 p-5"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <p className="text-sm font-semibold text-emerald-900">
                      {t('community.proposal_accepted', 'Proposal accepted!')}
                    </p>
                  </div>
                  <Link
                    href={
                      acceptedCustomOrderId > 0
                        ? `/custom-orders/${acceptedCustomOrderId}`
                        : '/custom-orders'
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-emerald-700 rounded-full hover:bg-emerald-800 transition-colors duration-200 shadow-sm"
                  >
                    <Package size={14} />
                    {t('community.view_custom_order', 'View your custom order')}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* F1: Sellers submit/edit ONLY in the Laravel dashboard (pro.beldify.com).
                The storefront PDP shows a read-only "Reply in your dashboard" CTA — no
                inline ResponseForm. Build/edit happens once, in Laravel. */}
            {!isMyPost && postIsOpen && isAuthenticated && !hasMyProposal && isSeller && (
              <div className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-5"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 ring-1 ring-amber-200 flex items-center justify-center shrink-0">
                      <Store size={14} className="text-amber-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {t('community.interested_q', 'Interested in this job?')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('community.seller_response_description', 'Submit your proposal directly to the buyer.')}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`${(process.env.NEXT_PUBLIC_API_URL || 'https://pro.beldify.com').replace(/\/$/, '')}/seller/community/posts/${postId}/respond`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm font-semibold text-white bg-indigo-700 rounded-full hover:bg-indigo-800 transition-colors duration-200 shadow-sm"
                  >
                    <ExternalLink size={14} />
                    {t('community.respond_in_dashboard', 'Reply in your seller dashboard')}
                  </a>
                </motion.div>
              </div>
            )}

            {/* F4: Non-seller note */}
            {!isMyPost && postIsOpen && isAuthenticated && !isSeller && (
              <div className="bg-amber-50 rounded-2xl ring-1 ring-amber-200 p-5">
                <p className="text-sm text-amber-800 leading-relaxed">
                  {t(
                    'community.only_sellers_can_respond',
                    'Only sellers can respond to requests. Register as a seller to submit a proposal.'
                  )}
                </p>
              </div>
            )}

            {/* Logged-out prompt */}
            {!isAuthenticated && postIsOpen && (
              <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-5 text-center">
                <LogIn size={24} className="text-indigo-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {t('community.login_to_propose', 'Want to submit a proposal?')}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  {t('community.login_cta_body', 'Sign in to your seller account to respond to this request.')}
                </p>
                <Link
                  href={`/login?redirect=/community/posts/${postId}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-indigo-700 rounded-full hover:bg-indigo-800 transition-colors"
                >
                  <LogIn size={14} />
                  {t('auth.sign_in', 'Sign In')}
                </Link>
              </div>
            )}

            {/* Already submitted banner */}
            {!isMyPost && hasMyProposal && (
              <div className="bg-emerald-50 rounded-2xl ring-1 ring-emerald-200 p-5 flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <p className="text-sm font-medium text-emerald-900">
                  {t('community.proposal_already_submitted', 'You have already submitted a proposal for this job.')}
                </p>
              </div>
            )}

            {/* Proposals list */}
            <div className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  {t('community.proposals', 'Proposals')}
                </h2>
                <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {proposalCount}
                </span>
              </div>

              {responses.length > 0 ? (
                <div className="p-4 space-y-3">
                  {responses.map((response, idx) => (
                    <motion.div
                      key={response.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                    >
                      <ResponseCard
                        response={response}
                        isPostOwner={isMyPost}
                        onAccept={() => handleAcceptResponse(Number(response.id))}
                        onReject={() => handleRejectResponse(Number(response.id))}
                        postId={postId}
                        isSubmitting={isSubmitting}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center mx-auto mb-4">
                    <MessagesSquare size={24} className="text-amber-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {t('community.no_proposals_yet_title', 'No proposals yet')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t('community.no_proposals_yet', 'Be the first artisan to respond!')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Mobile sticky CTA: reply in the seller dashboard (F1 — Laravel-only) ── */}
      {!isMyPost && postIsOpen && isAuthenticated && !hasMyProposal && isSeller && (
        <div className="lg:hidden fixed bottom-0 start-0 end-0 z-30 px-4 pb-4 pt-3 bg-white/90 backdrop-blur-sm border-t border-gray-200">
          <a
            href={`${(process.env.NEXT_PUBLIC_API_URL || 'https://pro.beldify.com').replace(/\/$/, '')}/seller/community/posts/${postId}/respond`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] text-sm font-semibold text-white bg-indigo-700 rounded-full hover:bg-indigo-800 transition-colors duration-200 shadow-md"
          >
            <ExternalLink size={15} />
            {t('community.respond_in_dashboard', 'Reply in your seller dashboard')}
          </a>
        </div>
      )}
    </div>
  );
}
