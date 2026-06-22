'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Wallet,
  MessagesSquare,
  ImageIcon,
  Send,
  UserCircle,
  Tag,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/utils/authUtils';
import logger from '@/utils/consoleLogger';
import { useDirection } from '@/hooks/useDirection';
import { 
  fetchCommunityPost, 
  fetchPostResponses, 
  updateResponseStatus,
  createCommunityResponse,
  redirectToSellerResponse
} from '@/services/communityService';
import { CommunityPost, CommunityResponse, CommunityImage } from '@/types/community';
import { S3_CONFIG, API_BASE_URL } from '@/config/constants';
import toast from '@/utils/toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ResponseCard from '@/components/community/ResponseCard';
import ResponseForm from '@/components/community/ResponseForm';

export default function PostDetailPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // Get auth token when component mounts
    const loadAuthToken = async () => {
      const token = await getAuthToken();
      setAuthToken(token);
    };
    loadAuthToken();
  }, []);
  const { isRTL } = useDirection();
  // Extract the numeric ID from the URL parameter (in case it contains a slug)
  const rawId = params?.id as string;
  // If the ID contains a dash (e.g., "123-post-title"), extract just the numeric part
  const postId = rawId.includes('-') ? rawId.split('-')[0] : rawId;

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [responses, setResponses] = useState<CommunityResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showResponseForm, setShowResponseForm] = useState(false);

  useEffect(() => {
    if (!postId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Set up headers with auth token
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        }
        
        const postResponse = await fetch(`${API_BASE_URL}/api/v1/community/posts/${postId}`, {
          headers,
          credentials: 'include',
        });
        
        if (!postResponse.ok) {
          const errorData = await postResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch post');
        }
        
        const postResult = await postResponse.json();
        
        // The API returns data in a 'data' property
        if (postResult.data) {
          setPost(postResult.data);
          
          try {
            // Then fetch the responses
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
            // Don't fail the whole page if responses fail to load
            setResponses([]);
          }
        } else {
          throw new Error('Invalid post data format');
        }
      } catch (err) {
        logger.error('Error in fetchData:', err);
        setError(t('community.error_fetching_post') || 'Failed to load post details');
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
  
  // Helper to handle different image formats in API response
  const getPostImages = (post: CommunityPost) => {
    if (!post.images || post.images.length === 0) return [];
    
    // Handle string array format
    if (typeof post.images[0] === 'string') {
      return post.images as string[];
    }
    
    // Handle object format with image_path
    return (post.images as CommunityImage[]).map(img => 
      typeof img === 'string' ? img : img.image_path
    );
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const localeMap: Record<string, string> = { en: 'en-US', fr: 'fr-FR', ar: 'ar-MA', ma: 'ar-MA', es: 'es-ES' };
      const bcp47 = localeMap[i18n.language] || 'fr-MA';
      return date.toLocaleDateString(bcp47) + ' ' + date.toLocaleTimeString(bcp47);
    } catch (error) {
      logger.error('Error formatting date:', error);
      return dateString;
    }
  };

  const handleAcceptResponse = async (responseId: number) => {
    const postUserId = post?.userId || post?.user?.id;
    if (!post || postUserId !== Number(user?.id)) {
      toast.error(t('community.not_authorized'));
      return;
    }

    try {
      setIsSubmitting(true);
      // Backend endpoint: POST /api/v1/community/posts/{post}/responses/{response}/accept
      await updateResponseStatus(postId, responseId.toString(), 'accepted');
      // Re-fetch post and responses data using the new service methods
      const updatedPostData = await fetchCommunityPost(postId);
      setPost(updatedPostData);
      const updatedResponsesData = await fetchPostResponses(postId);
      setResponses(updatedResponsesData || []);
    } catch (err) {
      logger.error('Error accepting response:', err);
      toast.error(t('community.error_accepting_response'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectResponse = async (responseId: number) => {
    const postUserId = post?.userId || post?.user?.id;
    if (!post || postUserId !== Number(user?.id)) {
      toast.error(t('community.not_authorized'));
      return;
    }

    try {
      setIsSubmitting(true);
      // Backend endpoint: POST /api/v1/community/posts/{post}/responses/{response}/reject
      await updateResponseStatus(postId, responseId.toString(), 'rejected'); 
      const updatedPostData = await fetchCommunityPost(postId);
      setPost(updatedPostData);
      const updatedResponsesData = await fetchPostResponses(postId);
      setResponses(updatedResponsesData || []);
    } catch (err) {
      logger.error('Error rejecting response:', err);
      toast.error(t('community.error_rejecting_response'));
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
      
      // Refresh post and responses data
      const updatedPostData = await fetchCommunityPost(postId);
      setPost(updatedPostData);
      const updatedResponsesData = await fetchPostResponses(postId);
      setResponses(updatedResponsesData || []);
      
      // Hide the response form after successful submission
      setShowResponseForm(false);
    } catch (err) {
      logger.error('Error submitting response:', err);
      setError(t('community.error_submitting_response'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
          <p className="text-sm text-gray-500">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-rose-50 rounded-2xl p-8 ring-1 ring-rose-200">
              <h2 className="text-xl font-bold mb-3 text-gray-900">{t('community.post_not_found')}</h2>
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

  // Stepper for post lifecycle: open → in_progress → completed
  const statusSteps: Array<{ key: string; label: string }> = [
    { key: 'open', label: t('community.status.open', 'Open') },
    { key: 'in_progress', label: t('community.status.in_progress', 'In Progress') },
    { key: 'completed', label: t('community.status.completed', 'Completed') },
  ];
  const currentStepIndex = statusSteps.findIndex(s => s.key === post.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-700 mb-8 transition-colors font-medium"
        >
          <ArrowLeft size={18} />
          {t('common.back_to')} {t('openSouk.brand', 'Open Souk')}
        </Link>

        {/* Status Stepper */}
        <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 p-5 mb-6">
          <div className="flex items-center gap-2">
            {statusSteps.map((step, index) => {
              const isCompleted = currentStepIndex > index;
              const isActive = currentStepIndex === index;
              return (
                <div key={step.key} className="flex items-center gap-2 flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                      ${isCompleted ? 'bg-indigo-700 text-white' : isActive ? 'bg-indigo-700 text-white ring-2 ring-amber-300' : 'bg-gray-200 text-gray-500'}`}>
                      {index + 1}
                    </div>
                    <span className={`font-mono text-[9px] tracking-[0.15em] uppercase whitespace-nowrap
                      ${isActive ? 'text-indigo-700 font-semibold' : isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mt-[-12px] ${isCompleted ? 'bg-indigo-700' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Post Header */}
        <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 overflow-hidden mb-6">
          <div className="p-6">
            <h1
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {post.title}
            </h1>

            {/* Post Meta — AI metadata caption style */}
            <div className="flex flex-wrap items-center gap-5 mb-5">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-gray-400" />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-600">
                  {formatDate(post.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessagesSquare size={13} className="text-gray-400" />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-600">
                  {responses.length} {t('community.responses')}
                </span>
              </div>
            </div>

            {/* Category */}
            {post.category && (
              <div className="mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ring-1 ring-amber-200">
                  <Tag size={12} />
                  {isRTL ? post.category.name_ar || post.category.name : post.category.name}
                </span>
              </div>
            )}

            {/* Budget */}
            {(post.budget_min && post.budget_max) || post.budget ? (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 rounded-2xl ring-1 ring-amber-200 mb-5">
                <Wallet size={16} className="text-amber-700 shrink-0" />
                <span className="text-sm font-medium text-amber-800">
                  {post.budget
                    ? `${post.budget.min} – ${post.budget.max} ${post.budget.currency}`
                    : `${post.budget_min} – ${post.budget_max} ${post.currency || 'MAD'}`
                  }
                </span>
              </div>
            ) : null}
          </div>

          {/* Post Images Gallery */}
          {post.images && post.images.length > 0 && (
            <div className="px-6 pb-6">
              <div className="relative w-full h-80 bg-amber-50 rounded-2xl overflow-hidden mb-3 group ring-1 ring-amber-200">
                <Image
                  src={getImageUrl(typeof post.images[activeImageIndex] === 'string' ? post.images[activeImageIndex] : post.images[activeImageIndex].image_path)}
                  alt={`${post.title} - Image ${activeImageIndex + 1}`}
                  fill
                  className="object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs backdrop-blur-sm">
                  {activeImageIndex + 1} / {post.images.length}
                </div>
              </div>

              {post.images.length > 1 && (
                <div className="flex overflow-x-auto gap-2 pb-1">
                  {post.images.map((image, index) => (
                    <button
                      key={index}
                      className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 transition-all duration-200 ring-2 ${
                        activeImageIndex === index ? 'ring-amber-500' : 'ring-amber-200 hover:ring-amber-300'
                      }`}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <Image
                        src={getImageUrl(typeof image === 'string' ? image : image.image_path)}
                        alt={`${post.title} - Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Post Description */}
          <div className="px-6 pb-6">
            <div className="bg-white rounded-2xl p-5 ring-1 ring-amber-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('community.description')}</h3>
              <p className="text-gray-700 leading-relaxed text-sm">{post.description}</p>
            </div>
          </div>

          {/* Timeline */}
          {post.timeline && (
            <div className="px-6 pb-6">
              <div className="bg-white rounded-2xl p-5 ring-1 ring-amber-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('community.timeline_label')}</h3>
                <p className="text-gray-700 text-sm">{post.timeline}</p>
              </div>
            </div>
          )}

          {/* Post Author */}
          <div className="px-6 pb-6">
            <div className="flex items-center pt-5 border-t border-amber-100">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-amber-50 ring-1 ring-amber-200">
                {(post.userAvatar || post.user?.avatar) ? (
                  <Image
                    src={getImageUrl(post.userAvatar || post.user?.avatar || '')}
                    alt={post.userName || post.user?.name || ''}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserCircle size={22} className="text-amber-600" />
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  {post.userName || post.user?.name}
                  {Number(user?.id) === (post.userId || post.user?.id) && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      {t('common.you')}
                    </span>
                  )}
                </p>
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock size={9} />
                  {formatDate(post.createdAt || post.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Response Section — Seller bid CTA with AI chip */}
        {!isMyPost && postIsOpen && isAuthenticated && (
          <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 p-6 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">
                  {t('community.respond_to_post')}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {t('community.seller_response_description')}
                </p>
                {/* Seller-side AI chip */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-700 text-white text-xs font-medium mb-4">
                  <Sparkles size={12} className="shrink-0" />
                  {t('ai.chip.photoEnhance', 'AI photo enhance for your portfolio')}
                </span>
              </div>
            </div>
            <button
              onClick={() => redirectToSellerResponse(postId, t('common.language_code', 'en'))}
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] text-sm font-semibold text-white bg-indigo-700 rounded-full hover:bg-indigo-800 transition-colors duration-200"
            >
              <Send size={16} />
              {t('community.respond_as_seller')}
            </button>
          </div>
        )}

        {/* Responses Section */}
        {responses.length > 0 && (
          <div className="bg-amber-50/40 rounded-2xl ring-1 ring-amber-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-amber-200">
              <h2 className="text-base font-semibold text-gray-900">
                {t('community.responses')} ({responses.length})
              </h2>
            </div>
            <div className="divide-y divide-amber-100 p-4 space-y-4">
              {responses.map((response) => (
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
        )}
      </div>
    </div>
  );
}
