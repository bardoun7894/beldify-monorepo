export interface Product {
  id: number;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  price: number;
  original_price?: number;
  discount_price?: number;
  has_discount?: boolean;
  images: string[];
  main_image?: string;
  category: string;
  category_ar?: string;
  brand?: {
    id: number;
    name: string;
    name_ar?: string;
  };
  color?: {
    code: string;
    name: string;
    name_ar?: string;
  };
  size?: {
    code: string;
    name: string;
    name_ar?: string;
  };
  customizable: boolean;
  in_stock: boolean;
  is_featured: boolean;
  rating?: number;
  reviews_count?: number;
  sku?: string;
  slug?: string;
  stock: number;
  /** Alias used by lib/types.ts Product — optional for backward compat */
  stock_quantity?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  store_id?: number;
  tailor_id?: number;
  styles?: TailoringStyle[];
  created_at: string;
  updated_at: string;
}

export interface TailoringStyle {
  id: number;
  name: string;
  description: string;
  base_price: number;
  image?: string;
  estimated_days: number;
  measurement_requirements: string[];
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  customizable?: boolean;
  inStock?: boolean;
  colors: string[];
  sizes: string[];
  fabrics: string[];
  sort?: string;
}
