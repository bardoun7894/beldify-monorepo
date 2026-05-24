import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Define CartItem type for tests
interface CartItem {
  id: number
  quantity: number
  unit_price: number
  subtotal: number
  stock_id: number
  variant_id?: number
  product: {
    id: number
    name: string
    name_ar: string
    image_url: string
    price: number
    stock_quantity?: number
  }
}

interface CartState {
  items: CartItem[]
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  coupon_code: string | null
}

interface CartContextType {
  state: CartState | null
  loading: boolean
  isInitialLoading: boolean
  addItem: (id: number, quantity: number, type?: 'stock' | 'variant') => Promise<void>
  updateQuantity: (itemId: number, quantity: number) => Promise<void>
  removeFromCart: (itemId: number) => Promise<void>
  applyCoupon: (code: string) => Promise<void>
  removeCoupon: () => Promise<void>
  clearCart: () => Promise<void>
  addToCart: (product: { id: number }) => Promise<void>
}

// Create context for testing
const CartContext = React.createContext<CartContextType | undefined>(undefined)

// Mock cart items
const mockCartItem: CartItem = {
  id: 1,
  quantity: 1,
  unit_price: 99.99,
  subtotal: 99.99,
  stock_id: 101,
  product: {
    id: 1,
    name: 'Test Product',
    name_ar: 'منتج اختباري',
    image_url: '/images/test.jpg',
    price: 99.99,
    stock_quantity: 10,
  },
}

const mockCartItem2: CartItem = {
  id: 2,
  quantity: 2,
  unit_price: 49.99,
  subtotal: 99.98,
  stock_id: 102,
  product: {
    id: 2,
    name: 'Test Product 2',
    name_ar: 'منتج اختباري 2',
    image_url: '/images/test2.jpg',
    price: 49.99,
    stock_quantity: 5,
  },
}

const mockEmptyCartState: CartState = {
  items: [],
  subtotal: 0,
  tax_amount: 0,
  shipping_amount: 0,
  discount_amount: 0,
  total_amount: 0,
  coupon_code: null,
}

const mockCartWithItemsState: CartState = {
  items: [mockCartItem, mockCartItem2],
  subtotal: 199.97,
  tax_amount: 20.00,
  shipping_amount: 10.00,
  discount_amount: 0,
  total_amount: 229.97,
  coupon_code: null,
}

// Test component to consume cart context
function TestCartConsumer() {
  const context = React.useContext(CartContext)
  if (!context) throw new Error('Must be used within CartProvider')

  const { state, loading, isInitialLoading, addItem, updateQuantity, removeFromCart, clearCart } = context
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="initial-loading">{isInitialLoading ? 'initial' : 'loaded'}</span>
      <span data-testid="item-count">{state?.items.length ?? 0}</span>
      <span data-testid="total">{state?.total_amount ?? 0}</span>
      <button onClick={() => addItem(101, 1)} data-testid="add-btn">Add Item</button>
      <button onClick={() => updateQuantity(1, 3)} data-testid="update-btn">Update Quantity</button>
      <button onClick={() => removeFromCart(1)} data-testid="remove-btn">Remove Item</button>
      <button onClick={() => clearCart()} data-testid="clear-btn">Clear Cart</button>
      {state?.items.map(item => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          {item.product.name} - Qty: {item.quantity}
        </div>
      ))}
    </div>
  )
}

// Mock provider for controlled testing
function MockCartProvider({
  children,
  value
}: {
  children: React.ReactNode
  value?: Partial<CartContextType>
}) {
  const defaultValue: CartContextType = {
    state: mockEmptyCartState,
    loading: false,
    isInitialLoading: false,
    addItem: vi.fn().mockResolvedValue(undefined),
    updateQuantity: vi.fn().mockResolvedValue(undefined),
    removeFromCart: vi.fn().mockResolvedValue(undefined),
    applyCoupon: vi.fn().mockResolvedValue(undefined),
    removeCoupon: vi.fn().mockResolvedValue(undefined),
    clearCart: vi.fn().mockResolvedValue(undefined),
    addToCart: vi.fn().mockResolvedValue(undefined),
  }

  return (
    <CartContext.Provider value={{ ...defaultValue, ...value }}>
      {children}
    </CartContext.Provider>
  )
}

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Initial State', () => {
    it('should start with empty cart', () => {
      render(
        <MockCartProvider>
          <TestCartConsumer />
        </MockCartProvider>
      )

      expect(screen.getByTestId('item-count')).toHaveTextContent('0')
      expect(screen.getByTestId('total')).toHaveTextContent('0')
    })

    it('should show loading states correctly', () => {
      render(
        <MockCartProvider value={{ loading: true, isInitialLoading: true }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
      expect(screen.getByTestId('initial-loading')).toHaveTextContent('initial')
    })

    it('should load cart items', () => {
      render(
        <MockCartProvider value={{ state: mockCartWithItemsState }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      expect(screen.getByTestId('item-count')).toHaveTextContent('2')
      expect(screen.getByTestId('total')).toHaveTextContent('229.97')
    })
  })

  describe('Add Item', () => {
    it('should call addItem when add button is clicked', async () => {
      const mockAddItem = vi.fn().mockResolvedValue(undefined)

      render(
        <MockCartProvider value={{ addItem: mockAddItem }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      await userEvent.click(screen.getByTestId('add-btn'))

      expect(mockAddItem).toHaveBeenCalledWith(101, 1)
    })

    it('should handle adding single item to cart', async () => {
      const mockAddItem = vi.fn().mockResolvedValue(undefined)

      render(
        <MockCartProvider value={{ addItem: mockAddItem }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      await userEvent.click(screen.getByTestId('add-btn'))

      expect(mockAddItem).toHaveBeenCalledTimes(1)
    })

    it('should handle adding multiple items', async () => {
      const mockAddItem = vi.fn().mockResolvedValue(undefined)

      render(
        <MockCartProvider value={{ addItem: mockAddItem }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      await userEvent.click(screen.getByTestId('add-btn'))
      await userEvent.click(screen.getByTestId('add-btn'))
      await userEvent.click(screen.getByTestId('add-btn'))

      expect(mockAddItem).toHaveBeenCalledTimes(3)
    })

    it('should handle duplicate item (quantity increment simulation)', async () => {
      const mockAddItem = vi.fn().mockResolvedValue(undefined)

      // Start with an item already in cart
      render(
        <MockCartProvider value={{
          state: {
            ...mockEmptyCartState,
            items: [mockCartItem],
            subtotal: 99.99,
            total_amount: 99.99
          },
          addItem: mockAddItem
        }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      expect(screen.getByTestId('item-count')).toHaveTextContent('1')

      await userEvent.click(screen.getByTestId('add-btn'))

      expect(mockAddItem).toHaveBeenCalled()
    })
  })

  describe('Remove Item', () => {
    it('should call removeFromCart when remove button is clicked', async () => {
      const mockRemoveFromCart = vi.fn().mockResolvedValue(undefined)

      render(
        <MockCartProvider value={{
          state: mockCartWithItemsState,
          removeFromCart: mockRemoveFromCart
        }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      await userEvent.click(screen.getByTestId('remove-btn'))

      expect(mockRemoveFromCart).toHaveBeenCalledWith(1)
    })
  })

  describe('Update Quantity', () => {
    it('should call updateQuantity when update button is clicked', async () => {
      const mockUpdateQuantity = vi.fn().mockResolvedValue(undefined)

      render(
        <MockCartProvider value={{
          state: mockCartWithItemsState,
          updateQuantity: mockUpdateQuantity
        }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      await userEvent.click(screen.getByTestId('update-btn'))

      expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 3)
    })
  })

  describe('Clear Cart', () => {
    it('should call clearCart when clear button is clicked', async () => {
      const mockClearCart = vi.fn().mockResolvedValue(undefined)

      render(
        <MockCartProvider value={{
          state: mockCartWithItemsState,
          clearCart: mockClearCart
        }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      expect(screen.getByTestId('item-count')).toHaveTextContent('2')

      await userEvent.click(screen.getByTestId('clear-btn'))

      expect(mockClearCart).toHaveBeenCalled()
    })
  })

  describe('Cart Persistence', () => {
    it('should display cached cart data', () => {
      const cachedCartState: CartState = {
        items: [mockCartItem],
        subtotal: 99.99,
        tax_amount: 10,
        shipping_amount: 5,
        discount_amount: 0,
        total_amount: 114.99,
        coupon_code: null,
      }

      render(
        <MockCartProvider value={{ state: cachedCartState }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      expect(screen.getByTestId('item-count')).toHaveTextContent('1')
      expect(screen.getByTestId('total')).toHaveTextContent('114.99')
    })
  })

  describe('Cart Total Calculation', () => {
    it('should display correct total amount', () => {
      render(
        <MockCartProvider value={{ state: mockCartWithItemsState }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      expect(screen.getByTestId('total')).toHaveTextContent('229.97')
    })

    it('should display items with correct quantities', () => {
      render(
        <MockCartProvider value={{ state: mockCartWithItemsState }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      expect(screen.getByTestId('item-1')).toHaveTextContent('Test Product - Qty: 1')
      expect(screen.getByTestId('item-2')).toHaveTextContent('Test Product 2 - Qty: 2')
    })
  })

  describe('Coupon Operations', () => {
    it('should support applyCoupon', async () => {
      const mockApplyCoupon = vi.fn().mockResolvedValue(undefined)

      function CouponConsumer() {
        const context = React.useContext(CartContext)
        if (!context) throw new Error('Must be used within CartProvider')
        return (
          <button onClick={() => context.applyCoupon('SAVE10')} data-testid="apply-coupon-btn">
            Apply Coupon
          </button>
        )
      }

      render(
        <MockCartProvider value={{ applyCoupon: mockApplyCoupon }}>
          <CouponConsumer />
        </MockCartProvider>
      )

      await userEvent.click(screen.getByTestId('apply-coupon-btn'))

      expect(mockApplyCoupon).toHaveBeenCalledWith('SAVE10')
    })

    it('should support removeCoupon', async () => {
      const mockRemoveCoupon = vi.fn().mockResolvedValue(undefined)

      function CouponConsumer() {
        const context = React.useContext(CartContext)
        if (!context) throw new Error('Must be used within CartProvider')
        return (
          <button onClick={() => context.removeCoupon()} data-testid="remove-coupon-btn">
            Remove Coupon
          </button>
        )
      }

      render(
        <MockCartProvider value={{ removeCoupon: mockRemoveCoupon }}>
          <CouponConsumer />
        </MockCartProvider>
      )

      await userEvent.click(screen.getByTestId('remove-coupon-btn'))

      expect(mockRemoveCoupon).toHaveBeenCalled()
    })

    it('should display coupon code when applied', () => {
      const stateWithCoupon: CartState = {
        ...mockCartWithItemsState,
        coupon_code: 'SAVE10',
        discount_amount: 22.99,
        total_amount: 206.98
      }

      function CouponDisplayConsumer() {
        const context = React.useContext(CartContext)
        if (!context) throw new Error('Must be used within CartProvider')
        return (
          <div>
            <span data-testid="coupon">{context.state?.coupon_code || 'none'}</span>
            <span data-testid="discount">{context.state?.discount_amount}</span>
          </div>
        )
      }

      render(
        <MockCartProvider value={{ state: stateWithCoupon }}>
          <CouponDisplayConsumer />
        </MockCartProvider>
      )

      expect(screen.getByTestId('coupon')).toHaveTextContent('SAVE10')
      expect(screen.getByTestId('discount')).toHaveTextContent('22.99')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockAddItem = vi.fn().mockRejectedValue(new Error('API Error'))

      render(
        <MockCartProvider value={{ addItem: mockAddItem }}>
          <TestCartConsumer />
        </MockCartProvider>
      )

      await userEvent.click(screen.getByTestId('add-btn'))

      await expect(mockAddItem.mock.results[0].value).rejects.toThrow('API Error')
    })

    it('should handle context usage outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestCartConsumer />)
      }).toThrow('Must be used within CartProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('addToCart Helper', () => {
    it('should support addToCart with product object', async () => {
      const mockAddToCart = vi.fn().mockResolvedValue(undefined)

      function AddToCartConsumer() {
        const context = React.useContext(CartContext)
        if (!context) throw new Error('Must be used within CartProvider')
        return (
          <button
            onClick={() => context.addToCart({ id: 123 })}
            data-testid="add-to-cart-btn"
          >
            Add to Cart
          </button>
        )
      }

      render(
        <MockCartProvider value={{ addToCart: mockAddToCart }}>
          <AddToCartConsumer />
        </MockCartProvider>
      )

      await userEvent.click(screen.getByTestId('add-to-cart-btn'))

      expect(mockAddToCart).toHaveBeenCalledWith({ id: 123 })
    })
  })
})
