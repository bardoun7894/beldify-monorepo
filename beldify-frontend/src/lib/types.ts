// Common interfaces used across the application

export interface Category {
  id: number;
  name_en: string;
  name_ar: string;
  image: string;
  slug: string;
  itemCount?: number;
  parent_id: number | null;
  store_id: number;
  category_name_en?: string; // For backward compatibility
  subcategories?: Category[]; // Added for subcategory support
}

export interface Stock {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Tailor {
  id: number;
  name: string;
  image: string;
  rating: number;
  experience: string;
}

export interface Product {
  id: number;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  price: string;
  original_price: string;
  discount_price: string | null;
  has_discount: boolean;
  images: string[];
  main_image: string | null;
  category: string | null;
  category_ar: string | null;
  brand: string | null;
  color: string | null;
  size: string | null;
  customizable: boolean | null;
  in_stock: boolean;
  is_featured: boolean;
  rating: number;
  reviews_count: number;
  sku: string | null;
  slug: string | null;
  stock_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  store_id: number;
}

export interface BestSellersResponse {
  best_sellers: Product[];
}

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  image: string;
  cta: string;
  color: string;
  link: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  status?: string;
}

export interface Shop {
  id: string;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  logo: string;
  cover: string;
  rating: number;
  reviews_count: number;
  products_count: number;
  location: string;
  location_ar?: string;
  joined_date: string;
  verified: boolean;
  categories: string[];
  shipping_time: string;
  return_policy: boolean;
  products: Product[];
}
