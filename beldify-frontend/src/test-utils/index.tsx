import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { vi } from 'vitest'

// Mock AuthContext value type
interface MockUser {
  id: number
  email: string
  full_name: string
  username?: string
  avatar?: string
  role?: string
}

interface MockAuthContextValue {
  user: MockUser | null
  loading: boolean
  isAuthenticated: boolean
  login: ReturnType<typeof vi.fn>
  register: ReturnType<typeof vi.fn>
  googleAuth: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
  updateProfile: ReturnType<typeof vi.fn>
  updatePassword: ReturnType<typeof vi.fn>
  updatePreferences: ReturnType<typeof vi.fn>
}

// Mock CartContext value type
interface MockCartItem {
  id: number
  product_id: number
  name: string
  price: number
  quantity: number
  image?: string
}

interface MockCartContextValue {
  items: MockCartItem[]
  loading: boolean
  itemCount: number
  total: number
  addItem: ReturnType<typeof vi.fn>
  removeItem: ReturnType<typeof vi.fn>
  updateQuantity: ReturnType<typeof vi.fn>
  clearCart: ReturnType<typeof vi.fn>
}

// Default mock values
export const defaultMockAuthContext: MockAuthContextValue = {
  user: null,
  loading: false,
  isAuthenticated: false,
  login: vi.fn().mockResolvedValue({ success: true }),
  register: vi.fn().mockResolvedValue({ success: true }),
  googleAuth: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
  updatePassword: vi.fn().mockResolvedValue({ success: true }),
  updatePreferences: vi.fn().mockResolvedValue({ success: true }),
}

export const defaultMockCartContext: MockCartContextValue = {
  items: [],
  loading: false,
  itemCount: 0,
  total: 0,
  addItem: vi.fn().mockResolvedValue(undefined),
  removeItem: vi.fn().mockResolvedValue(undefined),
  updateQuantity: vi.fn().mockResolvedValue(undefined),
  clearCart: vi.fn().mockResolvedValue(undefined),
}

// Create mock contexts
const MockAuthContext = React.createContext<MockAuthContextValue>(defaultMockAuthContext)
const MockCartContext = React.createContext<MockCartContextValue>(defaultMockCartContext)

// Export hooks for use in tests
export const useMockAuth = () => React.useContext(MockAuthContext)
export const useMockCart = () => React.useContext(MockCartContext)

interface ProvidersProps {
  children: React.ReactNode
  authValue?: Partial<MockAuthContextValue>
  cartValue?: Partial<MockCartContextValue>
}

// All providers wrapper
function AllProviders({ children, authValue = {}, cartValue = {} }: ProvidersProps) {
  const authContextValue = { ...defaultMockAuthContext, ...authValue }
  const cartContextValue = { ...defaultMockCartContext, ...cartValue }

  return (
    <MockAuthContext.Provider value={authContextValue}>
      <MockCartContext.Provider value={cartContextValue}>
        {children}
      </MockCartContext.Provider>
    </MockAuthContext.Provider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authValue?: Partial<MockAuthContextValue>
  cartValue?: Partial<MockCartContextValue>
}

// Custom render function with providers
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { authValue, cartValue, ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders authValue={authValue} cartValue={cartValue}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  })
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Export custom render as default render
export { customRender as render }

// Export types for test files
export type { MockUser, MockAuthContextValue, MockCartItem, MockCartContextValue }
