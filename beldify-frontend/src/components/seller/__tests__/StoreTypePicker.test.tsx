// @vitest-environment jsdom
/**
 * StoreTypePicker — tap-friendly "what do you sell?" chip picker.
 * Renders loading / error / options states from useStoreTypes and reports
 * the chosen store_type_id via onChange. Never auto-selects a default.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUseStoreTypes = vi.fn();
vi.mock('@/hooks/useStoreTypes', () => ({
  useStoreTypes: () => mockUseStoreTypes(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import StoreTypePicker from '@/components/seller/StoreTypePicker';

describe('StoreTypePicker', () => {
  beforeEach(() => {
    mockUseStoreTypes.mockReset();
  });

  it('shows a loading state and no selectable options while fetching', () => {
    mockUseStoreTypes.mockReturnValue({
      storeTypes: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<StoreTypePicker value={null} onChange={vi.fn()} />);

    expect(screen.getByTestId('store-type-loading')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('shows an error state (not a silently-picked default) when the fetch fails', () => {
    mockUseStoreTypes.mockReturnValue({
      storeTypes: [],
      isLoading: false,
      error: 'Network Error',
      refetch: vi.fn(),
    });

    render(<StoreTypePicker value={null} onChange={vi.fn()} />);

    expect(screen.getByTestId('store-type-error')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('renders one chip per store type and calls onChange with the picked id', () => {
    mockUseStoreTypes.mockReturnValue({
      storeTypes: [
        { id: 1, slug: 'regular', name: 'Regular Store' },
        { id: 4, slug: 'womenswear', name: "Women's Clothing" },
        { id: 5, slug: 'jewelry', name: 'Jewelry' },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    const onChange = vi.fn();
    render(<StoreTypePicker value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: "Women's Clothing" }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('marks the currently selected chip as pressed', () => {
    mockUseStoreTypes.mockReturnValue({
      storeTypes: [
        { id: 1, slug: 'regular', name: 'Regular Store' },
        { id: 5, slug: 'jewelry', name: 'Jewelry' },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<StoreTypePicker value={5} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Jewelry' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Regular Store' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
