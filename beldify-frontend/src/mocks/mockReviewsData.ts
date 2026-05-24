import { Review, ReviewSummary } from '@/types/review';

export const mockProductReviews: Record<string, Review[]> = {
  '1': [
    {
      id: 'rev1-prod1',
      productId: '1',
      userId: 'user123',
      userName: 'Aisha M.',
      userAvatar: '/images/avatars/avatar-female-1.jpg',
      rating: 5,
      title: 'Absolutely fantastic!',
      content: 'I am thoroughly impressed with the quality and design. It exceeded my expectations in every way. The material feels premium and the craftsmanship is top-notch. Delivery was also very quick. Highly recommend!',
      images: ['/images/products/product-detail-1.jpg', '/images/products/product-detail-2.jpg'],
      createdAt: new Date('2025-05-15T10:30:00Z').toISOString(),
      verified: true,
      likes: 152,
      dislikes: 3,
      userReaction: null,
    },
    {
      id: 'rev2-prod1',
      productId: '1',
      userId: 'user456',
      userName: 'Omar K.',
      userAvatar: '/images/avatars/avatar-male-1.jpg',
      rating: 4,
      title: 'Very good, but a small detail',
      content: 'Overall, a great product. It looks stylish and functions well. The only minor issue was a slight color variation from what I saw online, but it still looks good. Customer service was helpful when I inquired.',
      images: ['/images/products/product-detail-3.jpg'],
      createdAt: new Date('2025-05-10T14:45:00Z').toISOString(),
      verified: true,
      likes: 98,
      dislikes: 1,
      userReaction: 'like',
    },
    {
      id: 'rev3-prod1',
      productId: '1',
      userId: 'user789',
      userName: 'Layla B.',
      userAvatar: '/images/avatars/avatar-female-2.jpg',
      rating: 5,
      title: 'Perfect Purchase!',
      content: 'Couldn\'t be happier with this purchase. It\'s exactly what I was looking for. The packaging was also very secure and eco-friendly. Will definitely shop here again.',
      images: [],
      createdAt: new Date('2025-05-05T09:15:00Z').toISOString(),
      verified: true,
      likes: 76,
      dislikes: 0,
      userReaction: null,
    },
  ],
  // Add more reviews for other productIds if needed
};

export const mockProductReviewSummaries: Record<string, ReviewSummary> = {
  '1': {
    averageRating: 4.7,
    totalReviews: 3,
    ratingDistribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 1,
      5: 2,
    },
    verifiedPurchases: 3,
    withImages: 2,
    withComments: 3,
  },
  // Add more summaries for other productIds
};
