/**
 * TryOnButton — PDP virtual try-on entry point
 *
 * Tests:
 *  1. Hidden for jewelry vertical (isJewelry = true)
 *  2. Hidden when config fetch returns enabled:false
 *  3. Hidden when config fetch errors (resilience — never break PDP)
 *  4. Visible for apparel vertical when config is enabled
 *  5. Clicking opens the modal (onOpen is called)
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) =>
      typeof fallback === 'string' ? fallback : _key,
  }),
}));

const mockFetchTryonConfig = vi.fn();
vi.mock('@/services/tryonService', () => ({
  fetchTryonConfig: (...args: unknown[]) => mockFetchTryonConfig(...args),
  submitTryon: vi.fn(),
  fetchTryonStatus: vi.fn(),
}));

// Lazy import after mocks
async function importComponent() {
  const mod = await import('../TryOnButton');
  return mod.TryOnButton;
}

describe('TryOnButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is hidden for jewelry vertical regardless of config', async () => {
    mockFetchTryonConfig.mockResolvedValue({ enabled: true });
    const TryOnButton = await importComponent();
    const { container } = render(
      <TryOnButton isJewelry={true} productId="1" onOpen={vi.fn()} />
    );
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('is hidden when config returns enabled:false', async () => {
    mockFetchTryonConfig.mockResolvedValue({ enabled: false });
    const TryOnButton = await importComponent();
    const { container } = render(
      <TryOnButton isJewelry={false} productId="1" onOpen={vi.fn()} />
    );
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('is hidden when config fetch errors (graceful degradation)', async () => {
    mockFetchTryonConfig.mockRejectedValue(new Error('network error'));
    const TryOnButton = await importComponent();
    const { container } = render(
      <TryOnButton isJewelry={false} productId="1" onOpen={vi.fn()} />
    );
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders the try-on button for apparel when config is enabled', async () => {
    mockFetchTryonConfig.mockResolvedValue({ enabled: true });
    const TryOnButton = await importComponent();
    render(
      <TryOnButton isJewelry={false} productId="1" onOpen={vi.fn()} />
    );
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('calls onOpen when the button is clicked', async () => {
    mockFetchTryonConfig.mockResolvedValue({ enabled: true });
    const TryOnButton = await importComponent();
    const onOpen = vi.fn();
    render(
      <TryOnButton isJewelry={false} productId="1" onOpen={onOpen} />
    );
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
