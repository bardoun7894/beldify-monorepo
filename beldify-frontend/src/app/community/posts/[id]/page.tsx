'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Wallet,
  MessagesSquare,
  UserCircle,
  Tag,
  Wrench,
  ChevronDown,
  ChevronUp,
  Send,
  Package,
  Gem,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/utils/authUtils';
import { useDirection } from '@/hooks/useDirection';
import {
  fetchCommunityPost,
  fetchPostResponses,
  updateResponseStatus,
  createCommunityResponse,
} from '@/services/communityService';
import { CommunityPost, CommunityResponse, CommunityImage } from '@/types/community';
import { S3_CONFIG, API_BASE_URL } from '@/config/constants';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ResponseCard from '@/components/community/ResponseCard';
import ResponseForm from '@/components/community/ResponseForm';

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
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
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
              console.warn('Failed to fetch responses, continuing without them');
              setResponses([]);
            } else {
              const responsesResult = await responsesResponse.json();
              setResponses(responsesResult.data || []);
            }
          } catch (responseError) {
            console.error('Error fetching responses:', responseError);
            setResponses([]);
          }
        } else {
          throw new Error(t('community.error_invalid_post_data'));
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  const handleAcceptResponse = async (responseId: number) => {
    const postUserId = post?.userId || post?.user?.id;
    if (!post || postUserId !== Number(user?.id)) {
      alert(t('community.not_authorized'));
      return;
    }

    try {
      setIsSubmitting(true);
      // F5: accept returns {success:true} — no custom_order_id yet (OS-P1-8 deferred).
      // Capture it if the backend ever returns it; otherwise fall back to list link.
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
      console.error('Error accepting response:', err);
      alert(t('community.error_accepting_response'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectResponse = async (responseId: number) => {
    const postUserId = post?.userId || post?.user?.id;
    if (!post || postUserId !== Number(user?.id)) {
      alert(t('community.not_authorized'));
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
      console.error('Error rejecting response:', err);
      alert(t('community.error_rejecting_response'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitResponse = async (formData: FormData) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/community/posts/${postId}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await createCommunityResponse(postId, formData);

      const updatedPostData = await fetchCommunityPost(postId);
      setPost(updatedPostData);
      const updatedResponsesData = await fetchPostResponses(postId);
      setResponses(updatedResponsesData || []);

      setShowResponseForm(false);
    } catch (err) {
      console.error('Error submitting response:', err);
      setError(t('community.error_submitting_response'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-amber-100/70 rounded-2xl animate-pulse" />
          <div className="w-32 h-4 bg-amber-100/70 rounded-full animate-pulse" />
          <p className="text-sm text-gray-500">{t('common.loading', 'Loading…')}</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-amber-50/30 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-rose-50 rounded-2xl p-8 ring-1 ring-rose-200">
              <h2 className="text-xl font-bold mb-3 text-gray-900">
                {t('community.post_not_found')}
              </h2>
              <p className="mb-6 text-rose-700">{error || t('community.post_may_not_exist')}</p>
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

  // F4: only store owners / sellers can respond (respond route is role:store_owner).
  // Consistent with seller/register/page.tsx:213
  const isSeller = user?.role === 'seller' || (user as any)?.is_seller === true;

  // F3: normalise product_specifications (backend serialises as key→value object)
  // The community.ts type has string[] as placeholder; real API returns {[key:string]:string}.
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

  // Status pill
  const statusPillClass =
    post.status === 'open'
      ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
      : post.status === 'in_progress'
      ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'
      : 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200';

  const requiredSkills = post.requiredSkills ?? post.required_skills ?? [];

  // Buyer card: prefer post.buyer, fall back to legacy user fields
  const buyerName = post.buyer?.name ?? post.userName ?? post.user?.name;
  const buyerAvatar = post.buyer?.avatar ?? post.userAvatar ?? post.user?.avatar;

  const proposalCount =
    post.proposalCount ?? post.proposal_count ?? responses.length;

  return (
    <div className="min-h-screen bg-amber-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-700 mb-8 transition-colors font-medium text-sm"
        >
          <ArrowLeft size={16} />
          {t('openSouk.brand', 'Open Souk')}
        </Link>

        {/* Status strip */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusPillClass}`}
          >
            {t(`community.status.${post.status}`, post.status)}
          </span>
          <span className="text-xs text-gray-400">
            {proposalCount} {t('community.proposals', 'proposals')}
          </span>
        </div>

        {/* Two-column grid: left=job detail, right=proposals/form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ── LEFT COLUMN: Job detail ───────────────────────── */}
          <div className="space-y-4">
            {/* Header card */}
            <div className="bg-white rounded-2xl ring-1 ring-amber-200 overflow-hidden">
              {/* Title + meta */}
              <div className="p-6">
                <h1
                  className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight"
                  style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
                >
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-gray-400" />
                    {formatDate(post.created_at ?? post.createdAt)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessagesSquare size={12} className="text-gray-400" />
                    {proposalCount} {t('community.proposals', 'proposals')}
                  </div>
                </div>

                {/* Category */}
                {post.category && (
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ring-1 ring-amber-200">
                      <Tag size={11} />
                      {isRTL
                        ? post.category.name_ar ?? post.category.name
                        : post.category.name}
                    </span>
                  </div>
                )}

                {/* Budget */}
                {((post.budget_min && post.budget_max) || post.budget) && (
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 rounded-2xl ring-1 ring-amber-200">
                    <Wallet size={15} className="text-amber-700 shrink-0" />
                    <span className="currency-mad text-sm font-semibold text-amber-900">
                      {post.budget
                        ? `${post.budget.min} – ${post.budget.max} ${post.budget.currency}`
                        : `${post.budget_min} – ${post.budget_max} ${post.currency || 'MAD'}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Images gallery */}
              {post.images && post.images.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="relative w-full h-64 bg-amber-50 rounded-2xl overflow-hidden mb-3 group ring-1 ring-amber-200">
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
                          aria-label={`View image ${index + 1}`}
                          className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 transition-all duration-200 ring-2 ${
                            activeImageIndex === index
                              ? 'ring-amber-500'
                              : 'ring-amber-200 hover:ring-amber-300'
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
              )}

              {/* Description */}
              <div className="px-6 pb-5">
                <div className="bg-amber-50/50 rounded-2xl p-5 ring-1 ring-amber-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {t('community.description', 'Description')}
                  </h3>
                  <p
                    className={`text-gray-700 leading-relaxed text-sm whitespace-pre-line ${
                      !descExpanded ? 'line-clamp-5' : ''
                    }`}
                  >
                    {post.description}
                  </p>
                  {post.description && post.description.length > 300 && (
                    <button
                      onClick={() => setDescExpanded(v => !v)}
                      className="mt-2 text-xs text-indigo-700 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      {descExpanded ? (
                        <>
                          {t('common.show_less', 'Show less')} <ChevronUp size={12} />
                        </>
                      ) : (
                        <>
                          {t('common.show_more', 'Show more')} <ChevronDown size={12} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Timeline (deadline) */}
              {post.timeline && (
                <div className="px-6 pb-5">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">
                        {t('community.timeline_label', 'Timeline:')}
                      </span>{' '}
                      {post.timeline}
                    </span>
                  </div>
                </div>
              )}

              {/* Required skills */}
              {requiredSkills.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="flex items-start gap-2">
                    <Wrench size={14} className="text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
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
                  </div>
                </div>
              )}

              {/* F3: Custom-piece specifications (product_specifications key→value) */}
              {productSpecs && Object.keys(productSpecs).length > 0 && (
                <div className="px-6 pb-6">
                  <div className="flex items-start gap-2">
                    <Gem size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="w-full">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {t('community.product_specifications', 'Custom Piece Specifications')}
                      </p>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                        {Object.entries(productSpecs)
                          .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
                          .map(([key, value]) => (
                            <div key={key}>
                              <dt className="text-[10px] uppercase tracking-wide text-amber-700 font-semibold">
                                {key.replace(/_/g, ' ')}
                              </dt>
                              <dd className="text-sm font-medium text-gray-800 mt-0.5">
                                {String(value)}
                              </dd>
                            </div>
                          ))}
                      </dl>
                    </div>
                  </div>
                </div>
              )}

              {/* F3: Colors */}
              {productColors.length > 0 && (
                <div className="px-6 pb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
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

              {/* F3: Styles */}
              {productStyles.length > 0 && (
                <div className="px-6 pb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
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

              {/* Buyer card */}
              {buyerName && (
                <div className="px-6 pb-6">
                  <div className="flex items-center gap-3 pt-4 border-t border-amber-100">
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-amber-50 ring-2 ring-amber-200 shrink-0">
                      {buyerAvatar ? (
                        <Image
                          src={getImageUrl(buyerAvatar)}
                          alt={buyerName}
                          width={36}
                          height={36}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UserCircle size={20} className="text-amber-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {buyerName}
                        {Number(user?.id) === (post.userId || post.user?.id) && (
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
                </div>
              )}
            </div>

            {/* Lifecycle stepper */}
            <div className="bg-white rounded-2xl ring-1 ring-amber-200 p-5">
              <div className="flex items-center gap-2">
                {statusSteps.map((step, index) => {
                  const isCompleted = currentStepIndex > index;
                  const isActive = currentStepIndex === index;
                  return (
                    <div key={step.key} className="flex items-center gap-2 flex-1">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isCompleted
                              ? 'bg-indigo-700 text-white'
                              : isActive
                              ? 'bg-indigo-700 text-white ring-2 ring-amber-300'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span
                          className={`font-mono text-[9px] tracking-[0.15em] uppercase whitespace-nowrap ${
                            isActive
                              ? 'text-indigo-700 font-semibold'
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
                          className={`flex-1 h-0.5 mt-[-12px] ${
                            isCompleted ? 'bg-indigo-700' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Proposals + proposal form ──────── */}
          <div className="space-y-4">
            {/* F5: Post-accept CTA — "View your custom order" */}
            {acceptedCustomOrderId !== null && isMyPost && (
              <div className="bg-emerald-50 rounded-2xl ring-1 ring-emerald-200 p-5">
                <p className="text-sm font-semibold text-emerald-800 mb-3">
                  {t('community.proposal_accepted', 'Proposal accepted!')}
                </p>
                <Link
                  href={
                    acceptedCustomOrderId > 0
                      ? `/custom-orders/${acceptedCustomOrderId}`
                      : '/custom-orders'
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-emerald-700 rounded-full hover:bg-emerald-800 transition-colors duration-200"
                >
                  <Package size={15} />
                  {t('community.view_custom_order', 'View your custom order')}
                </Link>
              </div>
            )}

            {/* F4: Seller-only form gate */}
            {!isMyPost && postIsOpen && isAuthenticated && !hasMyProposal && isSeller && (
              <div className="bg-white rounded-2xl ring-1 ring-amber-200 overflow-hidden">
                {showResponseForm ? (
                  <ResponseForm
                    onSubmit={handleSubmitResponse}
                    onCancel={() => setShowResponseForm(false)}
                    isLoading={isSubmitting}
                  />
                ) : (
                  <div className="p-5">
                    <p className="text-sm text-gray-600 mb-4">
                      {t('community.seller_response_description', 'Interested? Send your proposal directly to the buyer.')}
                    </p>
                    <button
                      onClick={() => setShowResponseForm(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] text-sm font-semibold text-white bg-indigo-700 rounded-full hover:bg-indigo-800 transition-colors duration-200"
                    >
                      <Send size={15} />
                      {t('community.submit_proposal', 'Submit Proposal')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* F4: Non-seller note (authed buyer, not the post owner, post is open) */}
            {!isMyPost && postIsOpen && isAuthenticated && !isSeller && (
              <div className="bg-amber-50 rounded-2xl ring-1 ring-amber-200 p-5">
                <p className="text-sm text-amber-800">
                  {t(
                    'community.only_sellers_can_respond',
                    'Only sellers can respond to requests. Register as a seller to submit a proposal.'
                  )}
                </p>
              </div>
            )}

            {/* Already submitted banner */}
            {!isMyPost && hasMyProposal && (
              <div className="bg-emerald-50 rounded-2xl ring-1 ring-emerald-200 p-5">
                <p className="text-sm font-medium text-emerald-800">
                  {t('community.proposal_already_submitted', 'You have already submitted a proposal for this job.')}
                </p>
              </div>
            )}

            {/* Proposals list */}
            {responses.length > 0 ? (
              <div className="bg-white rounded-2xl ring-1 ring-amber-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {t('community.proposals', 'Proposals')}
                    <span className="ms-2 text-gray-400 font-normal">({responses.length})</span>
                  </h2>
                </div>
                <div className="p-4 space-y-4">
                  {responses.map(response => (
                    <ResponseCard
                      key={response.id}
                      response={response}
                      isPostOwner={isMyPost}
                      onAccept={() => handleAcceptResponse(Number(response.id))}
                      onReject={() => handleRejectResponse(Number(response.id))}
                      postId={postId}
                      isSubmitting={isSubmitting}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl ring-1 ring-amber-200 p-8 text-center">
                <MessagesSquare size={32} className="text-amber-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {t('community.no_proposals_yet', 'No proposals yet. Be the first!')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
