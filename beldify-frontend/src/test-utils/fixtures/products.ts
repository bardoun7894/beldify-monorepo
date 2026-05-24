// Mock product data for testing

export interface MockProduct {
  id: number
  name: string
  name_ar?: string
  description: string
  description_ar?: string
  price: number
  original_price?: number
  discount_percentage?: number
  category_id: number
  category_name: string
  images: string[]
  thumbnail: string
  stock: number
  rating: number
  reviews_count: number
  seller_id: number
  seller_name: string
  is_featured?: boolean
  is_new?: boolean
  created_at: string
  updated_at: string
}

export const mockProduct: MockProduct = {
  id: 101,
  name: 'Traditional Moroccan Caftan',
  name_ar: 'القفطان المغربي التقليدي',
  description: 'Handcrafted traditional Moroccan caftan with intricate embroidery',
  description_ar: 'قفطان مغربي تقليدي مصنوع يدويا مع تطريز دقيق',
  price: 299.99,
  original_price: 399.99,
  discount_percentage: 25,
  category_id: 1,
  category_name: 'Caftans',
  images: [
    '/images/products/caftan-1.jpg',
    '/images/products/caftan-2.jpg',
    '/images/products/caftan-3.jpg',
  ],
  thumbnail: '/images/products/caftan-1.jpg',
  stock: 15,
  rating: 4.8,
  reviews_count: 124,
  seller_id: 1,
  seller_name: 'Moroccan Treasures',
  is_featured: true,
  is_new: false,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T15:30:00Z',
}

export const mockProduct2: MockProduct = {
  id: 102,
  name: 'Embroidered Djellaba',
  name_ar: 'الجلابة المطرزة',
  description: 'Classic Moroccan djellaba with hand embroidery',
  description_ar: 'جلابة مغربية كلاسيكية بتطريز يدوي',
  price: 199.99,
  category_id: 2,
  category_name: 'Djellabas',
  images: ['/images/products/djellaba-1.jpg'],
  thumbnail: '/images/products/djellaba-1.jpg',
  stock: 20,
  rating: 4.5,
  reviews_count: 89,
  seller_id: 1,
  seller_name: 'Moroccan Treasures',
  is_new: true,
  created_at: '2024-02-01T08:00:00Z',
  updated_at: '2024-02-01T08:00:00Z',
}

export const mockProduct3: MockProduct = {
  id: 103,
  name: 'Moroccan Slippers (Babouche)',
  name_ar: 'البابوش المغربي',
  description: 'Traditional leather babouche handmade in Fez',
  description_ar: 'بابوش جلدي تقليدي مصنوع يدويا في فاس',
  price: 49.99,
  category_id: 3,
  category_name: 'Footwear',
  images: ['/images/products/babouche-1.jpg'],
  thumbnail: '/images/products/babouche-1.jpg',
  stock: 50,
  rating: 4.9,
  reviews_count: 256,
  seller_id: 2,
  seller_name: 'Fez Artisans',
  created_at: '2024-01-10T12:00:00Z',
  updated_at: '2024-01-10T12:00:00Z',
}

export const mockProducts: MockProduct[] = [mockProduct, mockProduct2, mockProduct3]

// Out of stock product
export const mockOutOfStockProduct: MockProduct = {
  ...mockProduct,
  id: 104,
  name: 'Limited Edition Caftan',
  stock: 0,
}

// Product with no reviews
export const mockNewProduct: MockProduct = {
  ...mockProduct2,
  id: 105,
  name: 'New Arrival Djellaba',
  rating: 0,
  reviews_count: 0,
  is_new: true,
}

// API response mocks
export const mockProductsApiResponse = {
  success: true,
  data: {
    products: mockProducts,
    pagination: {
      current_page: 1,
      total_pages: 5,
      total_items: 50,
      per_page: 10,
    },
  },
}

export const mockProductDetailApiResponse = {
  success: true,
  data: {
    product: mockProduct,
  },
}

export const mockProductSearchResponse = {
  success: true,
  data: {
    products: [mockProduct, mockProduct2],
    query: 'caftan',
    total: 2,
  },
}

// Categories for filtering tests
export interface MockCategory {
  id: number
  name: string
  name_ar: string
  slug: string
  products_count: number
}

export const mockCategories: MockCategory[] = [
  { id: 1, name: 'Caftans', name_ar: 'القفاطين', slug: 'caftans', products_count: 45 },
  { id: 2, name: 'Djellabas', name_ar: 'الجلابات', slug: 'djellabas', products_count: 32 },
  { id: 3, name: 'Footwear', name_ar: 'الأحذية', slug: 'footwear', products_count: 28 },
  { id: 4, name: 'Accessories', name_ar: 'الإكسسوارات', slug: 'accessories', products_count: 56 },
]
