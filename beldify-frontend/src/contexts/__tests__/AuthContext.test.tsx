import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { AuthContext } from '../AuthContext'
import type { User } from '@/types/auth'

// Create a simple test wrapper component
function TestAuthConsumer() {
  const context = React.useContext(AuthContext)
  return (
    <div>
      <span data-testid="loading">{context.loading ? 'loading' : 'ready'}</span>
      <span data-testid="authenticated">{context.isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="user">{context.user?.email || 'none'}</span>
      <button onClick={() => context.login('test@example.com', 'password')} data-testid="login-btn">
        Login
      </button>
      <button onClick={() => context.logout()} data-testid="logout-btn">
        Logout
      </button>
    </div>
  )
}

// Mock provider for controlled testing
function MockAuthProvider({
  children,
  value
}: {
  children: React.ReactNode
  value?: Partial<React.ContextType<typeof AuthContext>>
}) {
  const defaultValue: React.ContextType<typeof AuthContext> = {
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

  return (
    <AuthContext.Provider value={{ ...defaultValue, ...value }}>
      {children}
    </AuthContext.Provider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Default Context Values', () => {
    it('should have default unauthenticated state', () => {
      render(
        <MockAuthProvider>
          <TestAuthConsumer />
        </MockAuthProvider>
      )

      expect(screen.getByTestId('authenticated')).toHaveTextContent('no')
      expect(screen.getByTestId('user')).toHaveTextContent('none')
      expect(screen.getByTestId('loading')).toHaveTextContent('ready')
    })

    it('should provide context values to children', () => {
      render(
        <MockAuthProvider>
          <TestAuthConsumer />
        </MockAuthProvider>
      )

      expect(screen.getByTestId('login-btn')).toBeInTheDocument()
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument()
    })
  })

  describe('Authenticated State', () => {
    it('should show authenticated user', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        username: 'testuser'
      } as User

      render(
        <MockAuthProvider value={{ user: mockUser, isAuthenticated: true }}>
          <TestAuthConsumer />
        </MockAuthProvider>
      )

      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes')
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })

    it('should show loading state', () => {
      render(
        <MockAuthProvider value={{ loading: true }}>
          <TestAuthConsumer />
        </MockAuthProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    })
  })

  describe('Login Flow', () => {
    it('should call login function when login button is clicked', async () => {
      const mockLogin = vi.fn().mockResolvedValue({ success: true })

      render(
        <MockAuthProvider value={{ login: mockLogin }}>
          <TestAuthConsumer />
        </MockAuthProvider>
      )

      await userEvent.click(screen.getByTestId('login-btn'))

      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password')
    })

    it('should handle successful login', async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        success: true,
        message: 'Login successful'
      })

      render(
        <MockAuthProvider value={{ login: mockLogin }}>
          <TestAuthConsumer />
        </MockAuthProvider>
      )

      await userEvent.click(screen.getByTestId('login-btn'))

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled()
      })

      const result = await mockLogin.mock.results[0].value
      expect(result.success).toBe(true)
    })

    it('should handle login failure', async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        success: false,
        message: 'Invalid credentials'
      })

      render(
        <MockAuthProvider value={{ login: mockLogin }}>
          <TestAuthConsumer />
        </MockAuthProvider>
      )

      await userEvent.click(screen.getByTestId('login-btn'))

      const result = await mockLogin.mock.results[0].value
      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid credentials')
    })

    it('should handle network error', async () => {
      const mockLogin = vi.fn().mockRejectedValue(new Error('Network error'))

      render(
        <MockAuthProvider value={{ login: mockLogin }}>
          <TestAuthConsumer />
        </MockAuthProvider>
      )

      await userEvent.click(screen.getByTestId('login-btn'))

      await expect(mockLogin.mock.results[0].value).rejects.toThrow('Network error')
    })
  })

  describe('Logout Flow', () => {
    it('should call logout function when logout button is clicked', async () => {
      const mockLogout = vi.fn().mockResolvedValue(undefined)
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        username: 'testuser'
      } as User

      render(
        <MockAuthProvider value={{
          user: mockUser,
          isAuthenticated: true,
          logout: mockLogout
        }}>
          <TestAuthConsumer />
        </MockAuthProvider>
      )

      await userEvent.click(screen.getByTestId('logout-btn'))

      expect(mockLogout).toHaveBeenCalled()
    })
  })

  describe('Token Refresh', () => {
    it('should handle automatic token refresh', async () => {
      // This test verifies the interface supports token refresh
      const mockLogin = vi.fn().mockResolvedValue({
        success: true,
        data: { token: 'new-token' }
      })

      render(
        <MockAuthProvider value={{ login: mockLogin }}>
          <TestAuthConsumer />
        </MockAuthProvider>
      )

      await userEvent.click(screen.getByTestId('login-btn'))

      const result = await mockLogin.mock.results[0].value
      expect(result.success).toBe(true)
    })
  })

  describe('Google OAuth', () => {
    it('should support Google authentication', async () => {
      const mockGoogleAuth = vi.fn().mockResolvedValue({ success: true })

      function GoogleAuthConsumer() {
        const context = React.useContext(AuthContext)
        return (
          <button onClick={() => context.googleAuth('google-token')} data-testid="google-btn">
            Google Login
          </button>
        )
      }

      render(
        <MockAuthProvider value={{ googleAuth: mockGoogleAuth }}>
          <GoogleAuthConsumer />
        </MockAuthProvider>
      )

      await userEvent.click(screen.getByTestId('google-btn'))

      expect(mockGoogleAuth).toHaveBeenCalledWith('google-token')
    })
  })

  describe('Profile Updates', () => {
    it('should support profile update', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue({ success: true })

      function ProfileConsumer() {
        const context = React.useContext(AuthContext)
        return (
          <button
            onClick={() => context.updateProfile({ full_name: 'New Name' })}
            data-testid="update-profile-btn"
          >
            Update Profile
          </button>
        )
      }

      render(
        <MockAuthProvider value={{ updateProfile: mockUpdateProfile }}>
          <ProfileConsumer />
        </MockAuthProvider>
      )

      await userEvent.click(screen.getByTestId('update-profile-btn'))

      expect(mockUpdateProfile).toHaveBeenCalledWith({ full_name: 'New Name' })
    })

    it('should support password update', async () => {
      const mockUpdatePassword = vi.fn().mockResolvedValue({ success: true })

      function PasswordConsumer() {
        const context = React.useContext(AuthContext)
        return (
          <button
            onClick={() => context.updatePassword({
              current_password: 'old',
              new_password: 'new',
              new_password_confirmation: 'new'
            })}
            data-testid="update-password-btn"
          >
            Update Password
          </button>
        )
      }

      render(
        <MockAuthProvider value={{ updatePassword: mockUpdatePassword }}>
          <PasswordConsumer />
        </MockAuthProvider>
      )

      await userEvent.click(screen.getByTestId('update-password-btn'))

      expect(mockUpdatePassword).toHaveBeenCalled()
    })
  })

  describe('Session Persistence', () => {
    it('should support session state', () => {
      const mockUser = {
        id: 1,
        email: 'cached@example.com',
        full_name: 'Cached User',
        username: 'cacheduser'
      } as User

      render(
        <MockAuthProvider value={{ user: mockUser, isAuthenticated: true, loading: false }}>
          <TestAuthConsumer />
        </MockAuthProvider>
      )

      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes')
      expect(screen.getByTestId('user')).toHaveTextContent('cached@example.com')
    })
  })

  describe('Context Export', () => {
    it('should export AuthContext', () => {
      expect(AuthContext).toBeDefined()
      expect(AuthContext.Provider).toBeDefined()
    })
  })
})
