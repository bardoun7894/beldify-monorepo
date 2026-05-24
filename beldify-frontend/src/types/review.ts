export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  createdAt: string;
  updatedAt?: string;
  verified: boolean;
  likes: number;
  dislikes: number;
  userReaction?: 'like' | 'dislike' | null;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedPurchases: number;
  withImages: number;
  withComments: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  summary: ReviewSummary;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasMore: boolean;
  };
}

export interface CreateReviewRequest {
  productId: string;
  orderId?: string;
  rating: number;
  title: string; 
  content: string;
  images?: string[];   // URLs of uploaded images
  userName?: string;   // Optional: backend might get from auth session
  userAvatar?: string; // Optional: backend might get from auth session
  verified?: boolean;  // Optional: backend might determine this
}

export interface OrderReviewRequest {
  orderId: string;
  items: {
    productId: string;
    rating: number;
    title: string;
    content: string;
    images?: File[];
  }[];
}
