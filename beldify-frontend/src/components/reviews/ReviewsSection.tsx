import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Review, ReviewSummary as ReviewSummaryType, ReviewsResponse, CreateReviewRequest } from '@/types/review';
import ReviewSummary from './ReviewSummary';
import ReviewCard from './ReviewCard';
import { ReviewForm } from './ReviewForm'; 
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockReviewService } from '@/services/mockReviewService'; // Using mock service
import { PlusCircleIcon, AdjustmentsHorizontalIcon, StarIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/classNames';
import logger from '@/utils/consoleLogger';

interface ReviewsSectionProps {
  productId: string;
  productName: string; // For display purposes, e.g., "Reviews for Product X"
}

const ITEMS_PER_PAGE = 5;

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ productId, productName }) => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummaryType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({
    sort: 'newest',
    rating: null, // e.g., 5 for 5 stars, null for all
  });

  const fetchReviewsAndSummary = useCallback(async (page: number, filters: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: ReviewsResponse = await mockReviewService.getProductReviews(
        productId,
        page,
        ITEMS_PER_PAGE,
        filters
      );
      setReviews(prevReviews => page === 1 ? response.reviews : [...prevReviews, ...response.reviews]);
      setSummary(response.summary);
      setTotalPages(response.pagination.totalPages);
      setTotalReviews(response.pagination.totalItems);
      setCurrentPage(response.pagination.currentPage);
    } catch (err) {
      logger.error('Failed to fetch reviews:', err);
      setError(t('reviews.fetch_error'));
      // Keep existing data on error if not first load
      if (page === 1) {
        setReviews([]);
        setSummary(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    fetchReviewsAndSummary(1, activeFilters); // Fetch on initial load and when filters change
  }, [fetchReviewsAndSummary, activeFilters]);

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoading) {
      fetchReviewsAndSummary(currentPage + 1, activeFilters);
    }
  };

  const handleFilterChange = (filterName: string, value: any) => {
    setActiveFilters(prev => ({ ...prev, [filterName]: value }));
    // Reset to page 1 when filters change, will trigger useEffect
  };
  
  const handleSortChange = (value: string) => {
    handleFilterChange('sort', value);
  };

  const handleRatingFilterChange = (rating: number | null) => {
    handleFilterChange('rating', rating);
  };

  const handleReviewSubmitted = (newReview: Review) => {
    setShowReviewForm(false);
    // Optimistically update or refetch
    // For mock, refetching page 1 with current filters to see the new review (if it matches filters)
    fetchReviewsAndSummary(1, activeFilters);
    // Potentially scroll to reviews section or new review
  };

  // This function is passed to ReviewCard, which expects (reviewId: string, updatedReview: Review) => void
  // We need to adapt or ensure ReviewCard is flexible. For now, let's assume ReviewCard calls a service directly
  // or this handler is for internal state update after ReviewCard's own service call.
  // The current ReviewCard calls mockReviewService.reactToReview itself and then calls onReactionUpdate.
  // So, onReactionUpdate in ReviewsSection should expect the updated review object.
  const handleReviewCardReactionUpdate = (reviewId: string, updatedReview: Review) => {
    try {
      setReviews(prevReviews =>
        prevReviews.map(r => 
          r.id === reviewId ? updatedReview : r
        )
      );
      // Optionally update summary if likes/dislikes are part of it
    } catch (err) {
      logger.error('Failed to update reaction:', err);
      // Handle error, maybe show a toast
    }
  };

  return (
    <section id="product-reviews" className="py-12 md:py-16 bg-amber-50/40 relative overflow-hidden">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
          <h2
            className="text-3xl font-bold tracking-tight text-gray-900 mb-4 sm:mb-0"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('reviews.customer_reviews_for', { productName })}
          </h2>
          <Button 
            onClick={() => setShowReviewForm(prev => !prev)}
            className={cn(
              "transition-all duration-200",
              showReviewForm
                ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                : "bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm"
            )}
            size="lg"
          >
            {showReviewForm ? (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('common.cancel')}
              </>
            ) : (
              <>
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                {t('reviews.write_review_button')}
              </>
            )}
          </Button>
        </div>

        {showReviewForm && (
          <div className="mb-10 bg-white rounded-2xl shadow-sm ring-1 ring-amber-200 p-6">
            <ReviewForm
              productId={productId}
              onSubmitSuccess={handleReviewSubmitted}
              onCancel={() => setShowReviewForm(false)}
              createReviewService={mockReviewService.createReview} 
            />
          </div>
        )}

        {summary && (
          <div className="mb-8 bg-white rounded-2xl shadow-sm ring-1 ring-amber-200 p-6 transition-all duration-200 hover:shadow-md">
            <h3
              className="text-xl font-semibold mb-4 text-gray-900"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
            >
              {t('reviews.rating_summary_title')}
            </h3>
            <ReviewSummary 
              summary={summary} 
              selectedRating={activeFilters.rating}
              onFilterChange={handleRatingFilterChange} 
            />
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-6 gap-4">
          <h3
            className="text-xl font-semibold text-gray-900 flex items-center"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, serif' }}
          >
            {t('reviews.all_reviews_count', { count: totalReviews || 0 })}
          </h3>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setShowFilters(prev => !prev)} 
              className="md:hidden bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
              {t('common.actions.filters')}
            </Button>
            <Select value={activeFilters.sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full md:w-[200px] bg-white border border-gray-200 shadow-sm hover:border-indigo-300 transition-colors">
                <SelectValue placeholder={t('reviews.sort_by_placeholder')} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
                <SelectItem value="newest" className="hover:bg-indigo-50">{t('reviews.sort_options.newest')}</SelectItem>
                <SelectItem value="oldest" className="hover:bg-indigo-50">{t('reviews.sort_options.oldest')}</SelectItem>
                <SelectItem value="highestRating" className="hover:bg-indigo-50">{t('reviews.sort_options.highest_rating')}</SelectItem>
                <SelectItem value="lowestRating" className="hover:bg-indigo-50">{t('reviews.sort_options.lowest_rating')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Collapsible filter section for mobile - can be expanded */} 
        {showFilters && (
            <div className="md:hidden mb-6 p-5 bg-white rounded-xl shadow-md border border-gray-100">
                <h4 className="text-md font-semibold mb-3 text-gray-800">{t('reviews.filter_reviews_by_rating')}</h4>
                {/* Rating filter buttons with premium styling */} 
                <div className="flex flex-wrap gap-2">
                    {[5,4,3,2,1].map(r => (
                        <Button 
                          key={r} 
                          className={cn(
                            "transition-all duration-200",
                            activeFilters.rating === r
                              ? "bg-indigo-700 text-white shadow-sm"
                              : "bg-white ring-1 ring-amber-200 text-gray-700 hover:ring-amber-300 rounded-full"
                          )}
                          onClick={() => handleRatingFilterChange(activeFilters.rating === r ? null : r)}
                        >
                          <div className="flex items-center">
                            <span>{r}</span>
                            <StarIcon className="h-4 w-4 ml-1 inline-block" />
                          </div>
                        </Button>
                    ))}
                    {activeFilters.rating && (
                      <Button 
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700" 
                        onClick={() => handleRatingFilterChange(null)}
                      >
                        {t('common.clear')}
                      </Button>
                    )}
                </div>
            </div>
        )}

        {isLoading && reviews.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-100 p-8">
            <div className="animate-spin rounded-full h-14 w-14 border-t-3 border-b-3 border-indigo-600 mx-auto opacity-75"></div>
            <p className="mt-6 text-gray-600 font-medium">{t('reviews.loading_reviews')}</p>
          </div>
        )}

        {!isLoading && error && reviews.length === 0 && (
          <div className="text-center py-12 bg-red-50 p-8 rounded-xl shadow-md border border-red-100">
            <div className="bg-red-100 text-red-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium text-lg">{error}</p>
            <Button 
              onClick={() => fetchReviewsAndSummary(1, activeFilters)}
              className="mt-4 bg-rose-50 hover:bg-rose-100 text-rose-700 ring-1 ring-rose-200"
            >
              {t('common.try_again')}
            </Button>
          </div>
        )}

        {!isLoading && !error && reviews.length === 0 && (
          <div className="text-center py-16 bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <div className="bg-indigo-100 text-indigo-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="text-gray-700 text-xl font-semibold">{t('reviews.no_reviews_yet')}</p>
            <p className="text-gray-500 mt-2">{t('reviews.be_the_first')}</p>
            <Button 
              onClick={() => setShowReviewForm(true)}
              className="mt-6 bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm"
              size="lg"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              {t('reviews.write_review_button')}
            </Button>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="space-y-8">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} onReactionUpdate={handleReviewCardReactionUpdate} />
            ))}
          </div>
        )}

        {!isLoading && currentPage < totalPages && reviews.length > 0 && (
          <div className="mt-10 text-center">
            <Button 
              onClick={handleLoadMore} 
              className="ring-1 ring-indigo-700 text-indigo-700 rounded-full hover:bg-indigo-50 transition-all duration-200"
              size="lg"
            >
              {t('reviews.load_more_reviews')}
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>
        )}
        
        {isLoading && reviews.length > 0 && (
          <div className="text-center py-8 mt-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto opacity-75"></div>
            <p className="mt-3 text-sm text-gray-600">{t('reviews.loading_more')}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
