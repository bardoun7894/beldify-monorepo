import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { ReviewSummary as ReviewSummaryType } from '@/types/review';

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
  onFilterChange?: (rating: number | null) => void;
  selectedRating: number | null;
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({ 
  summary, 
  onFilterChange,
  selectedRating
}) => {
  const { t } = useTranslation();
  
  // Calculate percentages for the rating bars
  const calculatePercentage = (count: number) => {
    return summary.totalReviews > 0 
      ? Math.round((count / summary.totalReviews) * 100) 
      : 0;
  };

  // Generate stars for the average rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<StarIcon key={i} className="h-5 w-5 text-amber-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarOutline className="h-5 w-5 text-amber-400" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <StarIcon className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<StarOutline key={i} className="h-5 w-5 text-amber-400" />);
      }
    }
    
    return stars;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left column - Average rating */}
        <div className="flex flex-col items-center justify-center md:w-1/3">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {summary.averageRating.toFixed(1)}
          </div>
          <div className="flex mb-2">
            {renderStars(summary.averageRating)}
          </div>
          <div className="text-sm text-gray-500">
            {t('reviews.based_on')} {summary.totalReviews} {t('reviews.reviews')}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
              {summary.verifiedPurchases} {t('reviews.verified')}
            </div>
            <div className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
              {summary.withImages} {t('reviews.with_images')}
            </div>
          </div>
        </div>
        
        {/* Right column - Rating distribution */}
        <div className="md:w-2/3 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => onFilterChange?.(selectedRating === star ? null : star)}
              className={`w-full flex items-center gap-2 p-1 rounded hover:bg-gray-50 transition-colors ${
                selectedRating === star ? 'bg-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium">{star}</span>
                <StarIcon className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${calculatePercentage(summary.ratingDistribution[star as keyof typeof summary.ratingDistribution])}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 w-16 text-right">
                {summary.ratingDistribution[star as keyof typeof summary.ratingDistribution]} ({calculatePercentage(summary.ratingDistribution[star as keyof typeof summary.ratingDistribution])}%)
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
