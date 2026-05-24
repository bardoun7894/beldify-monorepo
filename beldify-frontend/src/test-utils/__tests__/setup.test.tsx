import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../index'
import React from 'react'
import { mockUser, createAuthenticatedContext } from '../fixtures/user'
import { mockCartItems, createCartWithItemsContext, calculateCartTotal, calculateItemCount } from '../fixtures/cart'
import { mockProducts } from '../fixtures/products'

// Simple test component
function TestComponent({ text = 'Hello Test' }: { text?: string }) {
  return <div data-testid="test-component">{text}</div>
}

describe('Test Setup Verification', () => {
  describe('Vitest Configuration', () => {
    it('should run a basic test', () => {
      expect(true).toBe(true)
    })

    it('should support async tests', async () => {
      const result = await Promise.resolve('async works')
      expect(result).toBe('async works')
    })

    it('should support mocking', () => {
      const mockFn = vi.fn().mockReturnValue('mocked')
      expect(mockFn()).toBe('mocked')
      expect(mockFn).toHaveBeenCalled()
    })
  })

  describe('React Testing Library', () => {
    it('should render components', () => {
      render(<TestComponent />)
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
    })

    it('should render with custom text', () => {
      render(<TestComponent text="Custom Text" />)
      expect(screen.getByText('Custom Text')).toBeInTheDocument()
    })

    it('should support jest-dom matchers', () => {
      render(<TestComponent text="Test Content" />)
      const element = screen.getByTestId('test-component')
      expect(element).toBeInTheDocument()
      expect(element).toHaveTextContent('Test Content')
      expect(element).toBeVisible()
    })
  })

  describe('Custom Render with Providers', () => {
    it('should render with default context values', () => {
      render(<TestComponent />)
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
    })

    it('should render with custom auth context', () => {
      render(<TestComponent />, {
        authValue: createAuthenticatedContext(mockUser),
      })
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
    })

    it('should render with custom cart context', () => {
      render(<TestComponent />, {
        cartValue: createCartWithItemsContext(mockCartItems),
      })
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
    })
  })

  describe('Test Fixtures', () => {
    it('should have valid user fixture', () => {
      expect(mockUser).toBeDefined()
      expect(mockUser.id).toBe(1)
      expect(mockUser.email).toBe('test@example.com')
      expect(mockUser.full_name).toBe('Test User')
    })

    it('should have valid cart fixtures', () => {
      expect(mockCartItems).toBeDefined()
      expect(mockCartItems.length).toBeGreaterThan(0)
      expect(mockCartItems[0].name).toBeDefined()
      expect(mockCartItems[0].price).toBeDefined()
    })

    it('should calculate cart totals correctly', () => {
      const total = calculateCartTotal(mockCartItems)
      const expectedTotal = mockCartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      expect(total).toBe(expectedTotal)
    })

    it('should calculate item count correctly', () => {
      const count = calculateItemCount(mockCartItems)
      const expectedCount = mockCartItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      )
      expect(count).toBe(expectedCount)
    })

    it('should have valid product fixtures', () => {
      expect(mockProducts).toBeDefined()
      expect(mockProducts.length).toBeGreaterThan(0)
      expect(mockProducts[0].name).toBeDefined()
      expect(mockProducts[0].price).toBeDefined()
      expect(mockProducts[0].category_name).toBeDefined()
    })
  })

  describe('Mock Browser APIs', () => {
    it('should have localStorage mocked', () => {
      localStorage.setItem('test', 'value')
      expect(localStorage.setItem).toHaveBeenCalledWith('test', 'value')
    })

    it('should have matchMedia mocked', () => {
      const mq = window.matchMedia('(min-width: 768px)')
      expect(mq).toBeDefined()
      expect(mq.matches).toBe(false)
    })

    it('should have ResizeObserver mocked', () => {
      const observer = new ResizeObserver(() => {})
      expect(observer).toBeDefined()
      expect(observer.observe).toBeDefined()
    })

    it('should have IntersectionObserver mocked', () => {
      const observer = new IntersectionObserver(() => {})
      expect(observer).toBeDefined()
      expect(observer.observe).toBeDefined()
    })
  })
})
