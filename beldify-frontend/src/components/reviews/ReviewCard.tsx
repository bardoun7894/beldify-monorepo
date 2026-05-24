import React, { useState } from 'react';
import Image from 'next/image';
import { StarIcon } from '@heroicons/react/24/solid';
import { HandThumbUpIcon as ThumbUpIcon, HandThumbDownIcon as ThumbDownIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as ThumbUpSolid, HandThumbDownIcon as ThumbDownSolid } from '@heroicons/react/24/solid';
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
    <div className="relative bg-white rounded-2xl p-5 shadow-sm ring-1 ring-amber-200 mb-6 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      
      {/* Review Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-200 mr-3 ring-2 ring-amber-300 shadow-md">
            {review.userAvatar ? (
              <Image
                src={getImageUrl(review.userAvatar)}
                alt={review.userName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-indigo-700 text-white font-medium text-lg">
                {review.userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{review.userName}</div>
            <div className="text-sm text-gray-500">{formattedDate}</div>
          </div>
        </div>
        
        {/* Verified badge — Atlas eyebrow style §6.7 */}
        {review.verified && (
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-medium">
            {t('reviews.verified_buyer', 'Verified buyer')}
          </p>
        )}
      </div>
      
      {/* Rating */}
      <div className="mb-3">
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={cn(
                "h-5 w-5", 
                i < review.rating 
                  ? "text-amber-400 drop-shadow-sm" 
                  : "text-gray-200"
              )}
            />
          ))}
          <span className="ml-2 text-sm font-medium text-gray-600">
            {review.rating}/5
          </span>
        </div>
        <h3
          className="text-lg font-semibold text-gray-900"
          style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
        >
          {review.title}
        </h3>
      </div>
      
      {/* Review content */}
      <div className="text-gray-700 mb-4 bg-amber-50/60 p-3 rounded-2xl ring-1 ring-amber-100">
        <p className="leading-relaxed">{truncatedContent}</p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-2 flex items-center"
          >
            {t('reviews.read_more')}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
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
                className="relative h-20 w-20 rounded-md overflow-hidden border border-gray-200 hover:border-indigo-500 transition-all duration-200 hover:shadow-md"
              >
                <Image
                  src={getImageUrl(image)}
                  alt={`${t('reviews.review_image')} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
          
          {/* Image modal */}
          {selectedImage && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="relative max-w-4xl max-h-full bg-white bg-opacity-10 rounded-xl p-1 shadow-2xl">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                >
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="relative h-[80vh] w-[80vw] max-w-4xl rounded-lg overflow-hidden">
                  <Image
                    src={getImageUrl(selectedImage)}
                    alt={t('reviews.review_image')}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Review footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleReaction('like')}
            disabled={isSubmitting}
            className={cn(
              "flex items-center space-x-1 text-sm px-3 py-1.5 rounded-full transition-all duration-200",
              userReaction === 'like' 
                ? "bg-indigo-50 text-indigo-600 font-medium shadow-sm" 
                : "text-gray-600 hover:bg-gray-100"
            )}
            aria-label={t('reviews.helpful')}
          >
            {userReaction === 'like' ? (
              <ThumbUpSolid className="h-4 w-4 mr-1" />
            ) : (
              <ThumbUpIcon className="h-4 w-4 mr-1" />
            )}
            <span>{likes}</span>
            <span className="sr-only md:not-sr-only md:inline-block ml-1">{t('reviews.helpful')}</span>
          </button>
          
          <button
            onClick={() => handleReaction('dislike')}
            disabled={isSubmitting}
            className={cn(
              "flex items-center space-x-1 text-sm px-3 py-1.5 rounded-full transition-all duration-200",
              userReaction === 'dislike' 
                ? "bg-gray-100 text-gray-700 font-medium shadow-sm" 
                : "text-gray-600 hover:bg-gray-100"
            )}
            aria-label={t('reviews.not_helpful')}
          >
            {userReaction === 'dislike' ? (
              <ThumbDownSolid className="h-4 w-4 mr-1" />
            ) : (
              <ThumbDownIcon className="h-4 w-4 mr-1" />
            )}
            <span>{dislikes}</span>
            <span className="sr-only md:not-sr-only md:inline-block ml-1">{t('reviews.not_helpful')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
