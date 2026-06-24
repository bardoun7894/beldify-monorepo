/**
 * TryOnModal — virtual try-on flow
 *
 * Tests:
 *  1. Step 1: photo picker renders with privacy note
 *  2. Step 1: selecting a file shows a preview
 *  3. Step 1: generate button calls submitTryon
 *  4. Step 2: after submit shows generating/progress state
 *  5. Step 3: on success shows result image + buy CTA
 *  6. 429 error shows daily-limit message
 *  7. 403 error calls onHideFeature
 *  8. Fail status shows error + retry button
 *  9. Esc key closes the modal
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) =>
      typeof fallback === 'string' ? fallback : _key,
  }),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | false | null | undefined)[]) =>
    classes.filter(Boolean).join(' '),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/products/1',
  useRouter: () => ({ push: vi.fn() }),
}));

const mockSubmitTryon = vi.fn();
const mockFetchTryonStatus = vi.fn();
vi.mock('@/services/tryonService', () => ({
  fetchTryonConfig: vi.fn().mockResolvedValue({ enabled: true }),
  submitTryon: (...args: unknown[]) => mockSubmitTryon(...args),
  fetchTryonStatus: (...args: unknown[]) => mockFetchTryonStatus(...args),
}));

// Stub URL.createObjectURL / revokeObjectURL (not in jsdom)
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  configurable: true,
  value: vi.fn(() => 'blob:mock-preview-url'),
});
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

// Stub Image so onload fires (jsdom Image doesn't fire onload for blob: URLs)
vi.stubGlobal('Image', class {
  width = 100;
  height = 100;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_: string) {
    // Fire in next microtask
    queueMicrotask(() => this.onload?.());
  }
});

// Utility: create a fake file
function fakeFile(name = 'photo.jpg', type = 'image/jpeg') {
  return new File(['data'], name, { type });
}

async function importModal() {
  const mod = await import('../TryOnModal');
  return mod.TryOnModal;
}

// Helper to simulate file selection (sets files prop and fires change)
function selectFile(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, 'files', {
    value: [file],
    writable: false,
    configurable: true,
  });
  fireEvent.change(input);
}

describe('TryOnModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('step 1: renders photo picker with privacy note', async () => {
    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="1"
        onBuyNow={vi.fn()}
      />
    );
    expect(screen.getByText(/processed by ai/i)).toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeTruthy();
  });

  it('step 1: selecting a file shows a preview image', async () => {
    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="1"
        onBuyNow={vi.fn()}
      />
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    selectFile(input, fakeFile());

    await waitFor(() => {
      // Preview img should appear
      const img = screen.getByAltText(/photo preview/i);
      expect(img).toBeInTheDocument();
    });
  });

  it('step 1: generate button calls submitTryon', async () => {
    mockSubmitTryon.mockResolvedValue({ task_id: 'task-abc' });
    mockFetchTryonStatus.mockResolvedValue({
      status: 'generating',
      progress: 20,
      result_url: null,
      error: null,
    });

    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="5"
        onBuyNow={vi.fn()}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    selectFile(input, fakeFile());

    await waitFor(() => screen.getByAltText(/photo preview/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    });

    await waitFor(() => {
      expect(mockSubmitTryon).toHaveBeenCalledOnce();
    });
  });

  it('step 2: shows generating progress bar after submit', async () => {
    mockSubmitTryon.mockResolvedValue({ task_id: 'task-abc' });
    mockFetchTryonStatus.mockResolvedValue({
      status: 'generating',
      progress: 40,
      result_url: null,
      error: null,
    });

    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="5"
        onBuyNow={vi.fn()}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    selectFile(input, fakeFile());

    await waitFor(() => screen.getByAltText(/photo preview/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('step 3: success shows result image and buy CTA', async () => {
    // Status returns success immediately on first poll
    mockSubmitTryon.mockResolvedValue({ task_id: 'task-xyz' });
    mockFetchTryonStatus.mockResolvedValue({
      status: 'success',
      progress: 100,
      result_url: 'https://example.com/result.jpg',
      error: null,
    });

    const TryOnModal = await importModal();
    const onBuyNow = vi.fn();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="5"
        onBuyNow={onBuyNow}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    selectFile(input, fakeFile());

    await waitFor(() => screen.getByAltText(/photo preview/i));

    vi.useFakeTimers();
    try {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /generate/i }));
      });

      // Advance timer by 3.5s to trigger first poll cycle
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3500);
      });
    } finally {
      vi.useRealTimers();
    }

    await waitFor(() => {
      expect(screen.getByAltText(/result/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /buy/i })).toBeInTheDocument();
  });

  it('429 error shows daily-limit friendly message', async () => {
    const err = Object.assign(new Error('Too Many Requests'), {
      response: { status: 429 },
    });
    mockSubmitTryon.mockRejectedValue(err);

    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="5"
        onBuyNow={vi.fn()}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    selectFile(input, fakeFile());
    await waitFor(() => screen.getByAltText(/photo preview/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/daily limit/i)).toBeInTheDocument();
    });
  });

  it('403 error calls onHideFeature', async () => {
    const err = Object.assign(new Error('Forbidden'), {
      response: { status: 403 },
    });
    mockSubmitTryon.mockRejectedValue(err);

    const TryOnModal = await importModal();
    const onHideFeature = vi.fn();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={onHideFeature}
        productId="5"
        onBuyNow={vi.fn()}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    selectFile(input, fakeFile());
    await waitFor(() => screen.getByAltText(/photo preview/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    });

    await waitFor(() => {
      expect(onHideFeature).toHaveBeenCalled();
    });
  });

  it('fail status shows inline error with retry button', async () => {
    mockSubmitTryon.mockResolvedValue({ task_id: 'task-fail' });
    mockFetchTryonStatus.mockResolvedValue({
      status: 'fail',
      progress: 0,
      result_url: null,
      error: 'Processing failed',
    });

    const TryOnModal = await importModal();
    render(
      <TryOnModal
        open={true}
        onClose={vi.fn()}
        onHideFeature={vi.fn()}
        productId="5"
        onBuyNow={vi.fn()}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    selectFile(input, fakeFile());
    await waitFor(() => screen.getByAltText(/photo preview/i));

    vi.useFakeTimers();
    try {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /generate/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3500);
      });
    } finally {
      vi.useRealTimers();
    }

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  it('Esc key closes the modal', async () => {
    const TryOnModal = await importModal();
    const onClose = vi.fn();
    render(
      <TryOnModal
        open={true}
        onClose={onClose}
        onHideFeature={vi.fn()}
        productId="1"
        onBuyNow={vi.fn()}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
