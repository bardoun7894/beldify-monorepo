export interface Category {
  id: number;
  name?: string; // For backward compatibility
  name_en: string; // Changed from category_name_en
  name_ar: string; // Changed from category_name_ar
  image: string;
  slug: string;
  parent_id: number | null;
  store_id: number;
  /** Returned by getAllCategories on each leaf category; departments are not returned standalone. */
  parent?: { id: number; name_en: string; name_ar: string } | null;
  sub_categories?: Category[];
  productCount?: number;
  itemCount?: number;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface CategoryDetailsResponse {
  category: Category;
  subCategories: Category[];
  products: any[]; // Can be typed more specifically if needed
}
