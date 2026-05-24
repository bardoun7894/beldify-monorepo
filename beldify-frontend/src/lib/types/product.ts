export interface Product {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  price: number;
  discount_price?: number;
  has_discount?: boolean;
  category?: string;
  category_ar?: string;
  rating?: number;
  reviews_count?: number;
  main_image?: string | null;
  images?: {
    id: string;
    url: string;
    is_primary?: boolean;
    sort_order?: number;
  }[];
  variants?: {
    id: string;
    productId: string;
    sku: string;
    name: string;
    price: number;
    quantity: number;
    is_default: boolean;
    size: {
      id: number;
      name: string;
      name_ar: string;
      code: string;
    } | null;
    color: {
      id: number;
      name: string;
      name_ar: string;
      hex_code: string;
    } | null;
    fabric: {
      id: number;
      name: string;
      name_ar: string;
      code: string;
      description: string;
      description_ar: string;
    } | null;
    attributes: Record<string, any>;
    images: {
      id: string;
      url: string;
      is_primary?: boolean;
      sort_order?: number;
    }[];
  }[];
  shop?: {
    id: number;
    name: string;
    name_ar?: string;
    url_name?: string;
    logo?: string | null;
    location?: string;
    location_ar?: string;
    rating?: number;
    reviews_count?: number;
    products_count?: number;
    is_verified?: boolean;
    website?: string | null;
  };
}
