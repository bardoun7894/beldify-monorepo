export interface CommunityImage {
  id: number;
  image_path: string;
  order: number;
}

export interface CommunityPost {
  id: number | string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed';
  
  // Support both API formats
  budget_min?: number | string;
  budget_max?: number | string;
  currency?: string;
  budget?: {
    min: string | number;
    max: string | number;
    currency: string;
  };
  
  // Support both naming conventions
  timeline?: string;
  colors?: string[];
  styles?: string[];
  product_specifications?: string[];
  required_skills?: string[];
  productSpecifications?: string[];
  requiredSkills?: string[];
  
  // Support both naming conventions
  response_count?: number;
  responseCount?: number;
  hasResponses?: boolean;

  // Proposal / proposal-count — both naming conventions
  proposal_count?: number;
  proposalCount?: number;

  // Whether the authenticated seller has already submitted a proposal
  has_my_proposal?: boolean;
  hasMyProposal?: boolean;

  // Buyer mini-profile (populated in job-detail and job-list responses)
  buyer?: {
    id: number | string;
    name: string;
    avatar?: string;
  };
  
  // Support both image formats
  images: (CommunityImage | string)[];
  
  // Support both user data formats
  user?: {
    id: number | string;
    name: string;
    avatar?: string;
  };
  userId?: string | number;
  userName?: string;
  userAvatar?: string;
  
  // Support both category formats
  category?: {
    id: number | string;
    name: string;
    name_ar?: string;
  };
  categoryId?: string | number;
  
  // Support both date naming conventions
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shop {
  id: string | number;
  name: string;
  slug?: string | null;
  status: string;
  isVerified: boolean;
  is_verified?: boolean;
  logo: string | null;
  avatar?: string | null;
  image?: string | null;
  banner: string | null;
  description?: string;
  website?: string | null;
  rating?: number | null;
  totalReviews?: number;
  review_count?: number;
  storeUrl?: string | null;
  // Additional properties for API compatibility
  shop_name?: string;
  is_online?: boolean;
  isOnline?: boolean;
  last_seen?: string;
  lastSeen?: string;
  created_at?: string;
  createdAt?: string;
  phone?: string;
  // Nested shop object for API compatibility
  shop?: Shop;
  // User data
  user?: any;
}

export interface CommunityResponse {
  id: string | number;
  postId: string | number;
  userId: string | number;
  userName?: string;
  shopId?: string | number;
  shop?: Shop;
  shopName?: string;
  description: string;
  price?: number;
  currency?: string;
  // Delivery timeline — both naming conventions
  delivery_days?: number;
  deliveryDays?: number;
  status?: 'pending' | 'accepted' | 'rejected';
  sellerSkills?: string[];
  seller_skills?: string[];
  productSpecifications?: string[];
  product_specifications?: string[];
  productOffers?: Array<{
    id: string | number;
    name: string;
    price: number;
    currency: string;
    image?: string;
  }>;
  user?: {
    id: number;
    name: string;
    avatar?: string;
    shop?: Shop;
  };
  images?: CommunityImage[] | [];
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
  accepted?: boolean;
}

export interface MessageAttachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  url: string;
  is_image: boolean;
  created_at: string;
}

export interface Message {
  id: string | number;
  content?: string;
  senderId?: string;
  recipientId?: string;
  sender_id?: number; // For backward compatibility with API responses
  recipient_id?: number; // For backward compatibility with API responses
  senderType?: 'buyer' | 'seller' | 'unknown';
  recipientType?: 'buyer' | 'seller' | 'unknown';
  postId?: string;
  shop_id?: string | number; // Shop ID for conversation grouping
  shopId?: string | number; // Normalized shop ID
  shopName?: string; // Shop name for display
  shopAvatar?: string; // Shop avatar URL
  shop?: {
    id: number | string;
    name: string;
    avatar?: string;
    logo?: string;
  }; // Shop object for display
  // New conversation format properties
  name?: string; // Shop/conversation name
  logo?: string | null; // Shop logo
  avatar?: string | null; // Shop avatar
  last_message?: {
    id: number | string;
    content: string;
    is_read: boolean;
    created_at: string;
    attachments: MessageAttachment[];
  }; // Last message in conversation
  unread_count?: number; // Number of unread messages
  is_online?: boolean; // Shop online status
  receiver_id?: number | string; // Receiver ID
  created_at?: string;
  updated_at?: string;
  createdAt?: string; // For normalized frontend usage
  updatedAt?: string; // For normalized frontend usage
  isSentByMe?: boolean; // Flag to determine message positioning in UI
  self_sent?: boolean; // Flag from backend to indicate message was sent by current user
  isRead?: boolean; // Normalized property name
  is_read?: boolean; // Original API property name
  sender?: {
    id: number | string;
    name: string;
    fullName?: string;
    email?: string;
    avatar: string | null;
    isOnline?: boolean;
    lastSeen?: string | null;
    shop?: {
      id: number;
      name: string;
      description?: string;
      logo?: string | null;
      banner?: string | null;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
      isVerified?: boolean;
      rating?: number;
      reviewCount?: number;
      storeUrl?: string;
      createdAt?: string;
    } | null;
  };
  recipient?: {
    id: number | string;
    name: string;
    avatar: string | null;
  };
  attachments?: MessageAttachment[];
  isTemp?: boolean; // For optimistic UI updates
}

export interface CommunityInteraction {
  id: string;
  postId: string;
  responseId: string;
  buyerId: string;
  sellerId: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostFormData {
  title: string;
  description: string;
  images?: File[];
  categoryId: string;
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  
  // New fields
  productSpecifications?: string[];
  requiredSkills?: string[];
  timeline?: string;
  timelineValue?: string;
  timelineUnit?: 'days' | 'weeks' | 'months';
  colors?: string[];
  styles?: string[];
}

export interface CommunityResponseFormData {
  description: string;
  images?: File[];
  productOffers?: {
    productId: string;
    price: number;
    currency: string;
  }[];
  price?: number;
  currency?: string;
  // Delivery timeline in days
  delivery_days?: number;

  // New fields
  sellerSkills?: string[];
  productSpecifications?: string[];
}

// ── Open Souk — new shared types ──────────────────────────────────────────────

/**
 * Aggregate community stats returned by
 * GET /api/v1/community/sellers/{shopId}/stats
 */
export interface SellerCommunityStats {
  avg_rating: number;
  completed_jobs: number;
  total_proposals: number;
  response_rate: number;
  /** ISO-8601 date string */
  member_since: string;
}

/**
 * Filter params for the Open Souk job listing.
 * Maps to query params accepted by GET /api/v1/community/posts
 */
export interface JobFilters {
  category_id?: string;
  budget_min?: number | string;
  budget_max?: number | string;
  skills?: string[];
  status?: 'open' | 'in_progress' | 'completed';
  /** Full-text search query (maps to `q` on the backend) */
  q?: string;
  /** Backward-compat alias — use `q` for new code */
  search?: string;
}

/**
 * Sort option passed as the `sort` query parameter.
 * Values mirror the backend contract.
 */
export type JobSort =
  | 'latest'
  | 'oldest'
  | 'budget_asc'
  | 'budget_desc'
  | string;
