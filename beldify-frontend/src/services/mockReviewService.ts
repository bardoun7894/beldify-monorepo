import { Review, ReviewSummary, ReviewsResponse, CreateReviewRequest } from '@/types/review';
import { v4 as uuidv4 } from 'uuid';
import { mockProductReviews, mockProductReviewSummaries } from '@/mocks/mockReviewsData';

const SIMULATED_DELAY = 500; // ms

export const mockReviewService = {
  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 5,
    filters?: Record<string, any>
  ): Promise<ReviewsResponse> {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));

    let reviewsForProduct = mockProductReviews[productId] || [];

    // Apply filters (example: by rating)
    if (filters?.rating) {
      reviewsForProduct = reviewsForProduct.filter(r => r.rating === parseInt(filters.rating as string, 10));
    }

    // Apply sorting (example: newest, oldest, highestRating, lowestRating)
    if (filters?.sort) {
      switch (filters.sort) {
        case 'newest':
          reviewsForProduct.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'oldest':
          reviewsForProduct.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'highestRating':
          reviewsForProduct.sort((a, b) => b.rating - a.rating);
          break;
        case 'lowestRating':
          reviewsForProduct.sort((a, b) => a.rating - b.rating);
          break;
      }
    }

    const totalItems = reviewsForProduct.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedReviews = reviewsForProduct.slice((page - 1) * limit, page * limit);

    const summary = mockProductReviewSummaries[productId] || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedPurchases: 0,
      withImages: 0,
      withComments: 0,
    };

    return {
      reviews: paginatedReviews,
      summary,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasMore: page < totalPages,
      },
    };
  },

  async createReview(productId: string, reviewData: CreateReviewRequest): Promise<Review> {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));

    const newReview: Review = {
      id: uuidv4(),
      productId,
      userId: 'currentMockUser', // Replace with actual user ID in real app
      userName: reviewData.userName || 'Mock User',
      userAvatar: reviewData.userAvatar || '/images/avatars/avatar-placeholder.jpg',
      rating: reviewData.rating,
      title: reviewData.title || '', // Ensure title is not undefined
      content: reviewData.content,
      images: reviewData.images || [], // Should be string[] as per updated CreateReviewRequest
      createdAt: new Date().toISOString(),
      verified: reviewData.verified !== undefined ? reviewData.verified : true, // Mock verification
      likes: 0,
      dislikes: 0,
      userReaction: null,
    };

    if (!mockProductReviews[productId]) {
      mockProductReviews[productId] = [];
    }
    mockProductReviews[productId].unshift(newReview); // Add to the beginning

    // Update summary (simplified for mock)
    const summary = mockProductReviewSummaries[productId];
    if (summary) {
      summary.totalReviews += 1;
      summary.ratingDistribution[newReview.rating as keyof typeof summary.ratingDistribution] += 1;
      // Recalculate average rating (simplified)
      let totalRatingSum = 0;
      let numReviews = 0;
      Object.entries(summary.ratingDistribution).forEach(([rating, count]) => {
        totalRatingSum += parseInt(rating, 10) * count;
        numReviews += count;
      });
      summary.averageRating = parseFloat((totalRatingSum / numReviews).toFixed(1)) || 0;
      if (newReview.images && newReview.images.length > 0) summary.withImages +=1;
      if (newReview.content) summary.withComments +=1;
      if (newReview.verified) summary.verifiedPurchases +=1;
    }

    return newReview;
  },

  async reactToReview(reviewId: string, reaction: 'like' | 'dislike' | null): Promise<{ likes: number; dislikes: number; userReaction: 'like' | 'dislike' | null }> {
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY / 2));

    for (const productId in mockProductReviews) {
      const review = mockProductReviews[productId].find(r => r.id === reviewId);
      if (review) {
        const oldReaction = review.userReaction;

        // Revert previous reaction count
        if (oldReaction === 'like') review.likes = Math.max(0, review.likes - 1);
        if (oldReaction === 'dislike') review.dislikes = Math.max(0, review.dislikes - 1);

        // Apply new reaction
        if (reaction === 'like') {
          review.likes += 1;
          review.userReaction = review.userReaction === 'like' ? null : 'like';
        } else if (reaction === 'dislike') {
          review.dislikes += 1;
          review.userReaction = review.userReaction === 'dislike' ? null : 'dislike';
        } else {
          review.userReaction = null;
        }
        return { likes: review.likes, dislikes: review.dislikes, userReaction: review.userReaction };
      }
    }
    throw new Error('Review not found');
  },
};
