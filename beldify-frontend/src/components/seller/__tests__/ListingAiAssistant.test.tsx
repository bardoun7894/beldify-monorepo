// @vitest-environment jsdom
/**
 * TDD RED → GREEN — ListingAiAssistant
 *
 * Tests:
 *   1. Renders "Analyze with AI" button when available:true
 *   2. Button click calls analyzeListing service
 *   3. Renders category suggestion and clicking applies it via onApplyCategory
 *   4. Renders attribute chips and clicking one applies it via onApplyAttribute
 *   5. Renders quality score meter
 *   6. Renders tips list
 *   7. Renders policy flag banner (warning)
 *   8. Renders duplicate flag banner
 *   9. When available:false → button hidden / shows unavailable note
 *  10. RTL: dir is passed through (a11y)
 *  11. Live region (aria-live) for results
 *  12. Apply category chip updates parent state via callback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

// ─── Standard mocks ───────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Service mock ─────────────────────────────────────────────────────────────

const mockAnalyzeListing = vi.fn();
vi.mock('@/services/listingAiService', () => ({
  analyzeListing: (...args: unknown[]) => mockAnalyzeListing(...args),
}));

// ─── Test helpers ─────────────────────────────────────────────────────────────

const SUCCESS_RESULT = {
  available: true as const,
  suggested_category: { id: 3, name: 'Jewelry' },
  suggested_vertical: 'jewelry',
  attributes: { material: 'Silver', style: 'Traditional' },
  quality_score: 82,
  tips: ['Add more photos', 'Be specific about material'],
  flags: [],
};

const SUCCESS_WITH_FLAGS = {
  ...SUCCESS_RESULT,
  quality_score: 40,
  flags: [
    { type: 'policy' as const, message: 'Phone number detected in description' },
    { type: 'duplicate' as const, message: 'Similar listing found in your store' },
  ],
};

const UNAVAILABLE_RESULT = { available: false as const };

// Default props
const DEFAULT_PROPS = {
  title: 'Silver Ring',
  description: 'Handcrafted ring',
  category_id: undefined as number | undefined,
  onApplyCategory: vi.fn(),
  onApplyAttribute: vi.fn(),
  isRTL: false,
};

async function renderComponent(overrides: Partial<typeof DEFAULT_PROPS> = {}) {
  const props = { ...DEFAULT_PROPS, onApplyCategory: vi.fn(), onApplyAttribute: vi.fn(), ...overrides };
  const { ListingAiAssistant } = await import('@/components/seller/ListingAiAssistant');
  render(<ListingAiAssistant {...props} />);
  return props;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ListingAiAssistant — button', () => {
  beforeEach(() => {
    mockAnalyzeListing.mockResolvedValue(SUCCESS_RESULT);
  });

  it('renders an "Analyze with AI" button', async () => {
    await renderComponent();
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    expect(btn).toBeTruthy();
  });

  it('calls analyzeListing with title and description on button click', async () => {
    await renderComponent({ title: 'Gold Bracelet', description: 'Pure gold' });
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => {
      expect(mockAnalyzeListing).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Gold Bracelet', description: 'Pure gold' })
      );
    });
  });

  it('passes category_id to analyzeListing when provided', async () => {
    await renderComponent({ category_id: 5 });
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => {
      expect(mockAnalyzeListing).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: 5 })
      );
    });
  });
});

describe('ListingAiAssistant — category suggestion', () => {
  beforeEach(() => {
    mockAnalyzeListing.mockResolvedValue(SUCCESS_RESULT);
  });

  it('renders category suggestion after analysis', async () => {
    await renderComponent();
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => {
      // Category name "Jewelry" should appear at least once
      const matches = screen.getAllByText(/jewelry/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it('calls onApplyCategory when category suggestion is clicked', async () => {
    const props = await renderComponent();
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    await act(async () => { fireEvent.click(btn); });
    // Wait for apply button to appear
    await waitFor(() => {
      expect(screen.getAllByText(/jewelry/i).length).toBeGreaterThan(0);
    });

    // Find the apply category button (has aria-label "Apply category Jewelry")
    const applyBtn = screen.getByRole('button', { name: /apply.*jewelry|jewelry.*apply|apply.*category/i });
    fireEvent.click(applyBtn);
    expect(props.onApplyCategory).toHaveBeenCalledWith(3, 'Jewelry');
  });
});

describe('ListingAiAssistant — attribute chips', () => {
  beforeEach(() => {
    mockAnalyzeListing.mockResolvedValue(SUCCESS_RESULT);
  });

  it('renders attribute chips for each attribute key', async () => {
    await renderComponent();
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => {
      // Attribute keys or values should appear as chips
      expect(screen.getByText(/silver/i)).toBeTruthy();
    });
  });

  it('calls onApplyAttribute when an attribute chip is clicked', async () => {
    const props = await renderComponent();
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    await act(async () => { fireEvent.click(btn); });

    // Wait for silver attribute to appear
    await waitFor(() => expect(screen.getByText(/silver/i)).toBeTruthy());

    // Find apply button for the material:Silver attribute
    const applyAttrBtn = screen.getByRole('button', { name: /apply.*silver|silver.*apply/i });
    fireEvent.click(applyAttrBtn);
    expect(props.onApplyAttribute).toHaveBeenCalledWith('material', 'Silver');
  });
});

describe('ListingAiAssistant — quality score', () => {
  beforeEach(() => {
    mockAnalyzeListing.mockResolvedValue(SUCCESS_RESULT);
  });

  it('renders quality score meter with value', async () => {
    await renderComponent();
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => {
      expect(screen.getByText(/82/)).toBeTruthy();
    });
  });
});

describe('ListingAiAssistant — tips', () => {
  beforeEach(() => {
    mockAnalyzeListing.mockResolvedValue(SUCCESS_RESULT);
  });

  it('renders the tips list', async () => {
    await renderComponent();
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => {
      expect(screen.getByText(/add more photos/i)).toBeTruthy();
      expect(screen.getByText(/be specific about material/i)).toBeTruthy();
    });
  });
});

describe('ListingAiAssistant — flags', () => {
  beforeEach(() => {
    mockAnalyzeListing.mockResolvedValue(SUCCESS_WITH_FLAGS);
  });

  it('renders policy flag banner', async () => {
    await renderComponent();
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => {
      expect(screen.getByText(/phone number detected/i)).toBeTruthy();
    });
  });

  it('renders duplicate flag banner', async () => {
    await renderComponent();
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => {
      expect(screen.getByText(/similar listing found/i)).toBeTruthy();
    });
  });
});

describe('ListingAiAssistant — available:false', () => {
  beforeEach(() => {
    mockAnalyzeListing.mockResolvedValue(UNAVAILABLE_RESULT);
  });

  it('hides analyze button or shows disabled/unavailable state when AI is off', async () => {
    await renderComponent();
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => {
      // After getting available:false, the button should be hidden or there should be an unavailable note
      const unavailableNote = screen.queryByText(/unavailable|not available|ai.*off|off/i);
      const buttonAfter = screen.queryByRole('button', { name: /analyze with ai/i });
      // Either the button is gone, disabled, or an unavailable note is shown
      expect(unavailableNote !== null || buttonAfter === null || buttonAfter?.hasAttribute('disabled')).toBe(true);
    });
  });
});

describe('ListingAiAssistant — a11y live region', () => {
  beforeEach(() => {
    mockAnalyzeListing.mockResolvedValue(SUCCESS_RESULT);
  });

  it('has an aria-live region for results', async () => {
    await renderComponent();
    const btn = screen.getByRole('button', { name: /analyze with ai/i });
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => {
      const liveRegion = document.querySelector('[aria-live]');
      expect(liveRegion).toBeTruthy();
    });
  });
});

describe('ListingAiAssistant — RTL', () => {
  beforeEach(() => {
    mockAnalyzeListing.mockResolvedValue(SUCCESS_RESULT);
  });

  it('renders with RTL dir attribute when isRTL=true', async () => {
    const { ListingAiAssistant } = await import('@/components/seller/ListingAiAssistant');
    const { container } = render(
      <ListingAiAssistant
        title="حلقة فضية"
        description="وصف المنتج"
        isRTL={true}
        onApplyCategory={vi.fn()}
        onApplyAttribute={vi.fn()}
      />
    );
    // The root element or wrapper should have dir="rtl"
    const rtlEl = container.querySelector('[dir="rtl"]');
    expect(rtlEl).toBeTruthy();
  });
});
