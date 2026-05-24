import { http, HttpResponse } from 'msw'
import { mockAuthResponse, mockLoginFailureResponse, mockRegistrationResponse, mockUser } from '../fixtures/user'
import { mockCartApiResponse, mockAddToCartResponse, mockRemoveFromCartResponse, mockClearCartResponse } from '../fixtures/cart'
import { mockProductsApiResponse, mockProductDetailApiResponse, mockProductSearchResponse } from '../fixtures/products'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export const handlers = [
  // Auth handlers
  http.post(`${API_BASE}/login`, async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string }

    // Simulate failed login for specific email
    if (body.email === 'wrong@example.com') {
      return HttpResponse.json(mockLoginFailureResponse, { status: 401 })
    }

    return HttpResponse.json(mockAuthResponse)
  }),

  http.post(`${API_BASE}/register`, async () => {
    return HttpResponse.json(mockRegistrationResponse)
  }),

  http.post(`${API_BASE}/logout`, async () => {
    return HttpResponse.json({ success: true, message: 'Logged out successfully' })
  }),

  http.post(`${API_BASE}/auth/google`, async () => {
    return HttpResponse.json(mockAuthResponse)
  }),

  http.get(`${API_BASE}/user`, async () => {
    return HttpResponse.json({
      success: true,
      data: { user: mockUser },
    })
  }),

  http.post(`${API_BASE}/refresh`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        token: 'new-mock-token-12345',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    })
  }),

  // Cart handlers
  http.get(`${API_BASE}/cart`, async () => {
    return HttpResponse.json(mockCartApiResponse)
  }),

  http.post(`${API_BASE}/cart/add`, async () => {
    return HttpResponse.json(mockAddToCartResponse)
  }),

  http.post(`${API_BASE}/cart/remove`, async () => {
    return HttpResponse.json(mockRemoveFromCartResponse)
  }),

  http.post(`${API_BASE}/cart/update`, async () => {
    return HttpResponse.json({
      success: true,
      message: 'Cart updated',
    })
  }),

  http.post(`${API_BASE}/cart/clear`, async () => {
    return HttpResponse.json(mockClearCartResponse)
  }),

  // Product handlers
  http.get(`${API_BASE}/products`, async () => {
    return HttpResponse.json(mockProductsApiResponse)
  }),

  http.get(`${API_BASE}/products/:id`, async () => {
    return HttpResponse.json(mockProductDetailApiResponse)
  }),

  http.get(`${API_BASE}/products/search`, async () => {
    return HttpResponse.json(mockProductSearchResponse)
  }),

  // Profile handlers
  http.put(`${API_BASE}/user/profile`, async () => {
    return HttpResponse.json({
      success: true,
      message: 'Profile updated',
      data: { user: mockUser },
    })
  }),

  http.put(`${API_BASE}/user/password`, async () => {
    return HttpResponse.json({
      success: true,
      message: 'Password updated',
    })
  }),

  http.put(`${API_BASE}/user/preferences`, async () => {
    return HttpResponse.json({
      success: true,
      message: 'Preferences updated',
    })
  }),
]

// Error handlers for testing error scenarios
export const errorHandlers = {
  networkError: http.post(`${API_BASE}/login`, async () => {
    return HttpResponse.error()
  }),

  serverError: http.post(`${API_BASE}/login`, async () => {
    return HttpResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }),

  unauthorized: http.get(`${API_BASE}/user`, async () => {
    return HttpResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }),

  tokenExpired: http.post(`${API_BASE}/refresh`, async () => {
    return HttpResponse.json(
      { success: false, message: 'Token expired' },
      { status: 401 }
    )
  }),
}
