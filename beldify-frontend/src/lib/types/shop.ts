export interface Shop {
  id: number;
  name: string;
  name_ar?: string;
  store_type: {
    id: number;
    name: string;
    name_ar?: string;
    slug: string;
    capabilities: string[];
  };
  profile: {
    store_name: string;
    store_name_ar?: string;
    store_logo: string | null;
    cover_image?: string | null;
    description: string | null;
    description_ar?: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    website: string | null;
    address?: string | null;
    location?: string | null;
    business_hours: Record<string, string>;
    shipping_methods: any[];
    payment_methods: string[];
    return_policy: string | null;
    shipping_policy: string | null;
    is_verified: boolean;
    is_featured?: boolean;
    status: 'active' | 'inactive' | 'suspended';
    social_media: Record<string, string>;
    business_categories: string[];
    rating: number;
    total_reviews: number;
    total_sales: number;
    store_locations: any[];
  };
  products?: any[];
  products_count?: number;
  categories?: {
    id: number | string;
    name: string;
    name_ar?: string;
    products_count: number;
  }[];
  revenue?: {
    amount: number;
    commission_amount: number;
    earned_at: string;
  }[];
  status: number | string | 'suspended' | 'active' | 'inactive';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Legacy fields for compatibility with existing components
  logo?: string | null;
  cover_image?: string | null;
  location?: string | null;
  description?: string | null;
  description_ar?: string | null;
  website?: string | null;
  is_verified?: boolean;
  rating?: number;
  reviews_count?: number;
  total_reviews?: number;
  contact_email?: string | null;
  contact_phone?: string | null;
  meta?: {
    data_source: string;
    version: string;
    migration_phase: number;
  };
  slug?: string | null;
  location_ar?: string | null;
  business_hours?: Record<string, string> | any[];
  payment_methods?: string[] | any[];
  shipping_methods?: any[];
  shipping_policy?: string | null;
  return_policy?: string | null;
}
