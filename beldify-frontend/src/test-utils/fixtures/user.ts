import type { MockUser, MockAuthContextValue } from '../index'
import { vi } from 'vitest'

// Mock user data for testing
export const mockUser: MockUser = {
  id: 1,
  email: 'test@example.com',
  full_name: 'Test User',
  username: 'testuser',
  avatar: '/images/avatar-placeholder.png',
  role: 'customer',
}

export const mockAdmin: MockUser = {
  id: 2,
  email: 'admin@example.com',
  full_name: 'Admin User',
  username: 'admin',
  avatar: '/images/avatar-placeholder.png',
  role: 'admin',
}

export const mockSeller: MockUser = {
  id: 3,
  email: 'seller@example.com',
  full_name: 'Seller User',
  username: 'seller',
  avatar: '/images/avatar-placeholder.png',
  role: 'seller',
}

// Auth response mock for login tests
export const mockAuthResponse = {
  success: true,
  message: 'Login successful',
  data: {
    user: mockUser,
    token: 'mock-jwt-token-12345',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
}

export const mockLoginFailureResponse = {
  success: false,
  message: 'Invalid credentials',
  errors: {
    email: ['The provided credentials are incorrect.'],
  },
}

export const mockRegistrationResponse = {
  success: true,
  message: 'Registration successful',
  data: {
    user: mockUser,
    token: 'mock-jwt-token-12345',
  },
}

// Create authenticated auth context
export const createAuthenticatedContext = (
  user: MockUser = mockUser
): Partial<MockAuthContextValue> => ({
  user,
  loading: false,
  isAuthenticated: true,
  login: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn().mockResolvedValue(undefined),
})

// Create unauthenticated auth context
export const createUnauthenticatedContext = (): Partial<MockAuthContextValue> => ({
  user: null,
  loading: false,
  isAuthenticated: false,
  login: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn().mockResolvedValue(undefined),
})

// Create loading auth context
export const createLoadingAuthContext = (): Partial<MockAuthContextValue> => ({
  user: null,
  loading: true,
  isAuthenticated: false,
})
