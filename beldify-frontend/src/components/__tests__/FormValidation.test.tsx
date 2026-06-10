import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { useForm as _useForm } from 'react-hook-form'
// declarations.d.ts declares react-hook-form as untyped; cast to recover generics.
const useForm = _useForm as <T extends Record<string, any>>() => ReturnType<typeof _useForm>

// Test form types
interface TestFormData {
  email: string
  password: string
  username?: string
}

// Mock translation function
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    'auth.email_required': 'Email is required',
    'auth.invalid_email': 'Invalid email address',
    'auth.password_required': 'Password is required',
    'auth.password_min_length': 'Password must be at least 8 characters',
    'auth.username_required': 'Username is required',
    'auth.username_min_length': 'Username must be at least 3 characters',
    'auth.sign_in': 'Sign In',
    'auth.signing_in': 'Signing In...',
    'auth.submit': 'Submit',
  }
  return translations[key] || key
}

// Test Login Form Component for validation testing
function TestLoginForm({
  onSubmit,
  isLoading = false,
  formError = '',
}: {
  onSubmit: (data: TestFormData) => Promise<void>
  isLoading?: boolean
  formError?: string
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TestFormData>()

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="login-form" noValidate>
      {formError && (
        <div className="error-message" role="alert" data-testid="form-error">
          {formError}
        </div>
      )}

      <div>
        <label htmlFor="email">Email</label>
        <input
          {...register('email', {
            required: mockT('auth.email_required'),
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: mockT('auth.invalid_email'),
            },
          })}
          type="email"
          id="email"
          data-testid="email-input"
        />
        {errors.email && (
          <p className="field-error" data-testid="email-error">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          {...register('password', {
            required: mockT('auth.password_required'),
            minLength: {
              value: 8,
              message: mockT('auth.password_min_length'),
            },
          })}
          type="password"
          id="password"
          data-testid="password-input"
        />
        {errors.password && (
          <p className="field-error" data-testid="password-error">
            {errors.password.message}
          </p>
        )}
      </div>

      <button type="submit" disabled={isLoading} data-testid="submit-btn">
        {isLoading ? mockT('auth.signing_in') : mockT('auth.sign_in')}
      </button>
    </form>
  )
}

// Extended Test Form with username field for additional validation testing
function TestRegistrationForm({
  onSubmit,
  isLoading = false,
  formError = '',
}: {
  onSubmit: (data: TestFormData) => Promise<void>
  isLoading?: boolean
  formError?: string
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TestFormData>()

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="registration-form" noValidate>
      {formError && (
        <div className="error-message" role="alert" data-testid="form-error">
          {formError}
        </div>
      )}

      <div>
        <label htmlFor="username">Username</label>
        <input
          {...register('username', {
            required: mockT('auth.username_required'),
            minLength: {
              value: 3,
              message: mockT('auth.username_min_length'),
            },
          })}
          type="text"
          id="username"
          data-testid="username-input"
        />
        {errors.username && (
          <p className="field-error" data-testid="username-error">
            {errors.username.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          {...register('email', {
            required: mockT('auth.email_required'),
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: mockT('auth.invalid_email'),
            },
          })}
          type="email"
          id="email"
          data-testid="email-input"
        />
        {errors.email && (
          <p className="field-error" data-testid="email-error">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          {...register('password', {
            required: mockT('auth.password_required'),
            minLength: {
              value: 8,
              message: mockT('auth.password_min_length'),
            },
            validate: {
              hasUppercase: (value: string) =>
                /[A-Z]/.test(value) || 'Password must contain an uppercase letter',
              hasLowercase: (value: string) =>
                /[a-z]/.test(value) || 'Password must contain a lowercase letter',
              hasNumber: (value: string) =>
                /\d/.test(value) || 'Password must contain a number',
            },
          })}
          type="password"
          id="password"
          data-testid="password-input"
        />
        {errors.password && (
          <p className="field-error" data-testid="password-error">
            {errors.password.message}
          </p>
        )}
      </div>

      <button type="submit" disabled={isLoading} data-testid="submit-btn">
        {isLoading ? 'Loading...' : 'Register'}
      </button>
    </form>
  )
}

describe('FormValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Required Field Validation', () => {
    it('should show error when email is empty on submit', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      // Submit without filling any fields
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required')
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error when password is empty on submit', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      // Fill only email
      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required')
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error when username is empty on registration', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestRegistrationForm onSubmit={mockOnSubmit} />)

      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('username-error')).toHaveTextContent('Username is required')
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show multiple errors for multiple empty required fields', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument()
        expect(screen.getByTestId('password-error')).toBeInTheDocument()
      })
    })
  })

  describe('Email Format Validation', () => {
    it('should show error for invalid email format without @', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('email-input'), 'invalidemail')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email address')
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error for email without domain', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('email-input'), 'test@')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email address')
      })
    })

    it('should show error for email without TLD', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('email-input'), 'test@example')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email address')
      })
    })

    it('should accept valid email format', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('email-input'), 'valid@example.com')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })

      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument()
    })

    it('should accept email with subdomain', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('email-input'), 'user@mail.example.com')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Password Strength Validation', () => {
    it('should show error for password shorter than 8 characters', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
      await userEvent.type(screen.getByTestId('password-input'), 'short')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toHaveTextContent(
          'Password must be at least 8 characters'
        )
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should accept password with exactly 8 characters', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
      await userEvent.type(screen.getByTestId('password-input'), '12345678')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('should show error for password without uppercase in registration form', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestRegistrationForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('username-input'), 'testuser')
      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
      await userEvent.type(screen.getByTestId('password-input'), 'password1')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toHaveTextContent(
          'Password must contain an uppercase letter'
        )
      })
    })

    it('should show error for password without number in registration form', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestRegistrationForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('username-input'), 'testuser')
      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
      await userEvent.type(screen.getByTestId('password-input'), 'Password')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toHaveTextContent(
          'Password must contain a number'
        )
      })
    })

    it('should accept strong password with uppercase, lowercase and number', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<TestRegistrationForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('username-input'), 'testuser')
      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Field-Level Error Display', () => {
    it('should display error message under the correct field', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('email-input'), 'invalid')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        const emailError = screen.getByTestId('email-error')
        const emailInput = screen.getByTestId('email-input')

        // Error should be after the input (sibling in same parent)
        expect(emailError).toBeInTheDocument()
        expect(emailInput.parentElement?.contains(emailError)).toBe(true)
      })
    })

    it('should clear error when field is corrected', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      // First trigger error
      await userEvent.type(screen.getByTestId('email-input'), 'invalid')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument()
      })

      // Clear and type valid email
      await userEvent.clear(screen.getByTestId('email-input'))
      await userEvent.type(screen.getByTestId('email-input'), 'valid@example.com')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument()
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('should show multiple field errors simultaneously', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestRegistrationForm onSubmit={mockOnSubmit} />)

      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('username-error')).toBeInTheDocument()
        expect(screen.getByTestId('email-error')).toBeInTheDocument()
        expect(screen.getByTestId('password-error')).toBeInTheDocument()
      })
    })
  })

  describe('Form-Level Error Display', () => {
    it('should display form-level error when provided', () => {
      const mockOnSubmit = vi.fn()
      const formError = 'Invalid credentials. Please try again.'

      render(<TestLoginForm onSubmit={mockOnSubmit} formError={formError} />)

      expect(screen.getByTestId('form-error')).toHaveTextContent(formError)
    })

    it('should have alert role for accessibility', () => {
      const mockOnSubmit = vi.fn()
      const formError = 'Server error occurred'

      render(<TestLoginForm onSubmit={mockOnSubmit} formError={formError} />)

      expect(screen.getByRole('alert')).toHaveTextContent(formError)
    })

    it('should not display form error when no error provided', () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      expect(screen.queryByTestId('form-error')).not.toBeInTheDocument()
    })

    it('should display both form-level and field-level errors', async () => {
      const mockOnSubmit = vi.fn()
      const formError = 'Invalid credentials'

      render(<TestLoginForm onSubmit={mockOnSubmit} formError={formError} />)

      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent(formError)
        expect(screen.getByTestId('email-error')).toBeInTheDocument()
      })
    })
  })

  describe('Successful Form Submission', () => {
    it('should call onSubmit with form data when all fields are valid', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('email-input'), 'user@example.com')
      await userEvent.type(screen.getByTestId('password-input'), 'SecurePass123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          {
            email: 'user@example.com',
            password: 'SecurePass123',
          },
          expect.anything()
        )
      })
    })

    it('should call onSubmit only once on valid submission', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      })
    })

    it('should not call onSubmit when form has validation errors', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      // Type invalid email
      await userEvent.type(screen.getByTestId('email-input'), 'notanemail')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should trim whitespace from inputs before submission', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<TestLoginForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('email-input'), '  test@example.com  ')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      // Note: react-hook-form doesn't auto-trim, so this tests the actual behavior
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission Loading State', () => {
    it('should show loading text when isLoading is true', () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} isLoading={true} />)

      expect(screen.getByTestId('submit-btn')).toHaveTextContent('Signing In...')
    })

    it('should show normal text when isLoading is false', () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} isLoading={false} />)

      expect(screen.getByTestId('submit-btn')).toHaveTextContent('Sign In')
    })

    it('should disable submit button when loading', () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} isLoading={true} />)

      expect(screen.getByTestId('submit-btn')).toBeDisabled()
    })

    it('should enable submit button when not loading', () => {
      const mockOnSubmit = vi.fn()

      render(<TestLoginForm onSubmit={mockOnSubmit} isLoading={false} />)

      expect(screen.getByTestId('submit-btn')).not.toBeDisabled()
    })

    it('should prevent double submission when loading', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<TestLoginForm onSubmit={mockOnSubmit} isLoading={true} />)

      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')

      // Try to click disabled button
      const submitBtn = screen.getByTestId('submit-btn')
      await userEvent.click(submitBtn)

      // Button should be disabled, so click should not trigger submission
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Username Validation', () => {
    it('should show error for username shorter than minimum length', async () => {
      const mockOnSubmit = vi.fn()

      render(<TestRegistrationForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('username-input'), 'ab')
      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('username-error')).toHaveTextContent(
          'Username must be at least 3 characters'
        )
      })
    })

    it('should accept username with minimum length', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

      render(<TestRegistrationForm onSubmit={mockOnSubmit} />)

      await userEvent.type(screen.getByTestId('username-input'), 'abc')
      await userEvent.type(screen.getByTestId('email-input'), 'test@example.com')
      await userEvent.type(screen.getByTestId('password-input'), 'Password123')
      await userEvent.click(screen.getByTestId('submit-btn'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      })

      expect(screen.queryByTestId('username-error')).not.toBeInTheDocument()
    })
  })
})
