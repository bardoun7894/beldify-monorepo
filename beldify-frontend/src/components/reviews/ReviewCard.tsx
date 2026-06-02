import React, { useState } from 'react';
import Image from 'next/image';
import { Star, ThumbsUp, ThumbsDown, X, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Review } from '@/types/review';
import { formatDate } from '@/utils/formatters';
import { getImageUrl } from '@/utils/imageUtils';
import { reviewService } from '@/services/api';
import { cn } from '@/utils/classNames';

interface ReviewCardProps {
  review: Review;
  onReactionUpdate?: (reviewId: string, updatedReview: Review) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onReactionUpdate }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(review.userReaction || null);
  const [likes, setLikes] = useState(review.likes);
  const [dislikes, setDislikes] = useState(review.dislikes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date to local format
  const formattedDate = formatDate(new Date(review.createdAt));
  
  // Determine if content should be truncated
  const shouldTruncate = review.content.length > 250 && !isExpanded;
  const truncatedContent = shouldTruncate
    ? `${review.content.substring(0, 250)}...`
    : review.content;

  // Handle reaction (like/dislike)
  const handleReaction = async (reaction: 'like' | 'dislike') => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Determine the new reaction state
      const newReaction = userReaction === reaction ? null : reaction;
      
      // Update UI optimistically
      const prevReaction = userReaction;
      const prevLikes = likes;
      const prevDislikes = dislikes;
      
      // Update local state
      setUserReaction(newReaction);
      
      // Update counts based on previous and new reaction
      if (prevReaction === 'like') setLikes(likes - 1);
      if (prevReaction === 'dislike') setDislikes(dislikes - 1);
      if (newReaction === 'like') setLikes(likes + (prevReaction === 'like' ? 0 : 1));
      if (newReaction === 'dislike') setDislikes(dislikes + (prevReaction === 'dislike' ? 0 : 1));
      
      // Call API
      await reviewService.reactToReview(review.id, newReaction);
      
      // Update parent component if callback provided
      if (onReactionUpdate) {
        const updatedReview = {
          ...review,
          userReaction: newReaction,
          likes: newReaction === 'like' ? likes + 1 : prevReaction === 'like' ? likes - 1 : likes,
          dislikes: newReaction === 'dislike' ? dislikes + 1 : prevReaction === 'dislike' ? dislikes - 1 : dislikes
        };
        onReactionUpdate(review.id, updatedReview);
      }
    } catch (error) {
      // Revert to previous state on error
      setUserReaction(userReaction);
      setLikes(likes);
      setDislikes(dislikes);
      console.error('Failed to update reaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="relative bg-white rounded-2xl p-6 shadow-atlas-sm ring-1 ring-amber-200 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-atlas-md">

      {/* Review Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar — RTL-safe: gap replaces mr- */}
          <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden bg-amber-100 ring-2 ring-amber-300 shadow-atlas-sm">
            {review.userAvatar ? (
              <Image
                src={getImageUrl(review.userAvatar)}
                alt={review.userName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-indigo-700 text-white font-semibold text-base">
                {review.userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{review.userName}</div>
            <div className="text-xs text-gray-500 mt-0.5">{formattedDate}</div>
          </div>
        </div>

        {/* Verified badge — Atlas eyebrow style §6.7 */}
        {review.verified && (
          <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-amber-700 font-medium bg-amber-50 ring-1 ring-amber-200 rounded-full px-2.5 py-1">
            {t('reviews.verified_buyer', 'Verified buyer')}
          </span>
        )}
      </div>

      {/* Rating + title */}
      <div className="mb-3">
        <div className="flex items-center gap-0.5 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-4 w-4',
                i < review.rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-200 fill-gray-200'
              )}
            />
          ))}
          <span className="ms-2 text-xs font-medium text-gray-500">
            {review.rating}/5
          </span>
        </div>
        {review.title && (
          <h3
            className="text-base font-semibold text-gray-900 leading-snug"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {review.title}
          </h3>
        )}
      </div>

      {/* Review content */}
      <div className="text-gray-700 mb-4 bg-amber-50/60 p-4 rounded-2xl ring-1 ring-amber-100 text-sm leading-relaxed">
        <p>{truncatedContent}</p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(true)}
            className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 text-xs font-medium mt-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30"
          >
            {t('reviews.read_more', 'Read more')}
            <ChevronDown className="w-3.5 h-3.5" aria-hidden />
          </button>
        )}
      </div>

      {/* Review images */}
      {review.images && review.images.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {review.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(image)}
                aria-label={`${t('reviews.review_image', 'Review image')} ${index + 1}`}
                className="relative h-20 w-20 rounded-xl overflow-hidden ring-1 ring-amber-200 hover:ring-indigo-700 transition-all duration-200 hover:shadow-atlas-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700"
              >
                <Image
                  src={getImageUrl(image)}
                  alt={`${t('reviews.review_image', 'Review image')} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {/* Image lightbox */}
          {selectedImage && (
            <div
              className="fixed inset-0 bg-gray-950/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label={t('reviews.review_image', 'Review image')}
            >
              <div className="relative max-w-4xl max-h-full rounded-2xl overflow-hidden shadow-atlas-xl">
                <button
                  onClick={() => setSelectedImage(null)}
                  aria-label={t('common.close', 'Close')}
                  className="absolute top-3 end-3 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-atlas-sm hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700"
                >
                  <X className="w-5 h-5 text-gray-800" aria-hidden />
                </button>
                <div className="relative h-[80vh] w-[80vw] max-w-4xl">
                  <Image
                    src={getImageUrl(selectedImage)}
                    alt={t('reviews.review_image', 'Review image')}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review footer — reaction buttons */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-amber-100">
        <button
          onClick={() => handleReaction('like')}
          disabled={isSubmitting}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
            userReaction === 'like'
              ? 'bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-200'
              : 'text-gray-500 hover:bg-amber-50 hover:text-gray-700'
          )}
          aria-label={t('reviews.helpful', 'Helpful')}
          aria-pressed={userReaction === 'like'}
        >
          <ThumbsUp
            className={cn('h-3.5 w-3.5', userReaction === 'like' ? 'fill-indigo-700' : '')}
            aria-hidden
          />
          <span>{likes}</span>
          <span className="sr-only md:not-sr-only">{t('reviews.helpful', 'Helpful')}</span>
        </button>

        <button
          onClick={() => handleReaction('dislike')}
          disabled={isSubmitting}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30',
            userReaction === 'dislike'
              ? 'bg-gray-100 text-gray-700 font-medium ring-1 ring-gray-200'
              : 'text-gray-500 hover:bg-amber-50 hover:text-gray-700'
          )}
          aria-label={t('reviews.not_helpful', 'Not helpful')}
          aria-pressed={userReaction === 'dislike'}
        >
          <ThumbsDown
            className={cn('h-3.5 w-3.5', userReaction === 'dislike' ? 'fill-gray-700' : '')}
            aria-hidden
          />
          <span>{dislikes}</span>
          <span className="sr-only md:not-sr-only">{t('reviews.not_helpful', 'Not helpful')}</span>
        </button>
      </div>
    </article>
  );
};

export default ReviewCard;
