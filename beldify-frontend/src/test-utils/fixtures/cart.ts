import type { MockCartItem, MockCartContextValue } from '../index'
import { vi } from 'vitest'

// Mock cart items for testing
export const mockCartItem: MockCartItem = {
  id: 1,
  product_id: 101,
  name: 'Traditional Moroccan Caftan',
  price: 299.99,
  quantity: 1,
  image: '/images/products/caftan-1.jpg',
}

export const mockCartItem2: MockCartItem = {
  id: 2,
  product_id: 102,
  name: 'Embroidered Djellaba',
  price: 199.99,
  quantity: 2,
  image: '/images/products/djellaba-1.jpg',
}

export const mockCartItem3: MockCartItem = {
  id: 3,
  product_id: 103,
  name: 'Moroccan Slippers (Babouche)',
  price: 49.99,
  quantity: 1,
  image: '/images/products/babouche-1.jpg',
}

// Cart with multiple items
export const mockCartItems: MockCartItem[] = [
  mockCartItem,
  mockCartItem2,
  mockCartItem3,
]

// Calculate cart total
export const calculateCartTotal = (items: MockCartItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}

// Calculate item count
export const calculateItemCount = (items: MockCartItem[]): number => {
  return items.reduce((count, item) => count + item.quantity, 0)
}

// Create empty cart context
export const createEmptyCartContext = (): Partial<MockCartContextValue> => ({
  items: [],
  loading: false,
  itemCount: 0,
  total: 0,
  addItem: vi.fn().mockResolvedValue(undefined),
  removeItem: vi.fn().mockResolvedValue(undefined),
  updateQuantity: vi.fn().mockResolvedValue(undefined),
  clearCart: vi.fn().mockResolvedValue(undefined),
})

// Create cart with items context
export const createCartWithItemsContext = (
  items: MockCartItem[] = mockCartItems
): Partial<MockCartContextValue> => ({
  items,
  loading: false,
  itemCount: calculateItemCount(items),
  total: calculateCartTotal(items),
  addItem: vi.fn().mockResolvedValue(undefined),
  removeItem: vi.fn().mockResolvedValue(undefined),
  updateQuantity: vi.fn().mockResolvedValue(undefined),
  clearCart: vi.fn().mockResolvedValue(undefined),
})

// Create loading cart context
export const createLoadingCartContext = (): Partial<MockCartContextValue> => ({
  items: [],
  loading: true,
  itemCount: 0,
  total: 0,
})

// API response mocks
export const mockCartApiResponse = {
  success: true,
  data: {
    items: mockCartItems,
    total: calculateCartTotal(mockCartItems),
    item_count: calculateItemCount(mockCartItems),
  },
}

export const mockAddToCartResponse = {
  success: true,
  message: 'Item added to cart',
  data: {
    cart_item: mockCartItem,
  },
}

export const mockRemoveFromCartResponse = {
  success: true,
  message: 'Item removed from cart',
}

export const mockUpdateQuantityResponse = {
  success: true,
  message: 'Quantity updated',
  data: {
    cart_item: { ...mockCartItem, quantity: 3 },
  },
}

export const mockClearCartResponse = {
  success: true,
  message: 'Cart cleared',
}
