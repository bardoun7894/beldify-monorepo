/**
 * AiImageGenerator — seller product edit AI image generation
 *
 * Tests:
 *  1. Renders thumbnail picker from existing product images
 *  2. Renders style selector (studio / lifestyle / white_bg)
 *  3. Submitting calls submitAiImage with correct args
 *  4. Shows generating state while polling
 *  5. On success refreshes image list (onRefresh called)
 *  6. 403 on POST hides the control gracefully
 *  7. Generate button disabled when no image is selected
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string | Record<string, unknown>, opts?: Record<string, unknown>) => {
      if (typeof fallback !== 'string') return _key;
      // Simple interpolation: replace {{key}} with opts values
      if (opts && typeof opts === 'object') {
        return fallback.replace(/\{\{(\w+)\}\}/g, (_m, k) => String(opts[k] ?? _m));
      }
      return fallback;
    },
  }),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | false | null | undefined)[]) =>
    classes.filter(Boolean).join(' '),
}));

const mockSubmitAiImage = vi.fn();
const mockFetchAiImageStatus = vi.fn();

vi.mock('@/services/tryonService', () => ({
  submitAiImage: (...args: unknown[]) => mockSubmitAiImage(...args),
  fetchAiImageStatus: (...args: unknown[]) => mockFetchAiImageStatus(...args),
  fetchTryonConfig: vi.fn().mockResolvedValue({ enabled: true }),
  submitTryon: vi.fn(),
  fetchTryonStatus: vi.fn(),
}));

const MOCK_IMAGES = [
  { id: 1, url: 'https://example.com/img1.jpg' },
  { id: 2, url: 'https://example.com/img2.jpg' },
];

async function importComponent() {
  const mod = await import('../AiImageGenerator');
  return mod.AiImageGenerator;
}

describe('AiImageGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish default implementations after clearAllMocks
    mockSubmitAiImage.mockResolvedValue({ task_id: 'default-task' });
    mockFetchAiImageStatus.mockResolvedValue({ status: 'generating', progress: 0, error: null });
  });

  it('renders thumbnail picker with existing images', async () => {
    const AiImageGenerator = await importComponent();
    render(
      <AiImageGenerator
        productId="42"
        existingImages={MOCK_IMAGES}
        onRefresh={vi.fn()}
      />
    );
    // Should render two thumbnail images
    const allImgs = screen.getAllByRole('img');
    expect(allImgs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders style selector with three options', async () => {
    const AiImageGenerator = await importComponent();
    render(
      <AiImageGenerator
        productId="42"
        existingImages={MOCK_IMAGES}
        onRefresh={vi.fn()}
      />
    );
    // studio, lifestyle, white_bg options rendered as radio buttons
    expect(screen.getByRole('radio', { name: /studio/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /lifestyle/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /white/i })).toBeInTheDocument();
  });

  it('generate button is disabled when no image is selected', async () => {
    const AiImageGenerator = await importComponent();
    render(
      <AiImageGenerator
        productId="42"
        existingImages={MOCK_IMAGES}
        onRefresh={vi.fn()}
      />
    );
    // The generate button should be disabled before any thumbnail is selected
    const generateBtn = screen.getByRole('button', { name: /generate with ai/i });
    expect(generateBtn).toBeDisabled();
  });

  it('calls submitAiImage with correct args on submit', async () => {
    mockSubmitAiImage.mockResolvedValue({ task_id: 'ai-img-task-1' });
    mockFetchAiImageStatus.mockResolvedValue({
      status: 'generating',
      progress: 30,
      error: null,
    });

    const AiImageGenerator = await importComponent();
    render(
      <AiImageGenerator
        productId="42"
        existingImages={MOCK_IMAGES}
        onRefresh={vi.fn()}
      />
    );

    // Click the radio thumbnail — wrapped in waitFor so React processes the update
    await waitFor(() => {
      fireEvent.click(screen.getByRole('radio', { name: /select image.*1/i }));
      const btn = screen.getByRole('button', { name: /generate with ai/i });
      if (btn.hasAttribute('disabled')) throw new Error('button still disabled');
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));
    });

    await waitFor(() => {
      expect(mockSubmitAiImage).toHaveBeenCalledWith('42', {
        source_image_id: 1,
        style: 'studio',
      });
    });
  });

  it('shows generating state while polling', async () => {
    mockSubmitAiImage.mockResolvedValue({ task_id: 'ai-img-task-2' });
    mockFetchAiImageStatus.mockResolvedValue({
      status: 'generating',
      progress: 50,
      error: null,
    });

    const AiImageGenerator = await importComponent();
    render(
      <AiImageGenerator
        productId="42"
        existingImages={MOCK_IMAGES}
        onRefresh={vi.fn()}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole('radio', { name: /select image.*1/i }));
      const btn = screen.getByRole('button', { name: /generate with ai/i });
      if (btn.hasAttribute('disabled')) throw new Error('button still disabled');
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('calls onRefresh when generation succeeds', async () => {
    mockSubmitAiImage.mockResolvedValue({ task_id: 'ai-img-task-3' });
    mockFetchAiImageStatus.mockResolvedValue({
      status: 'success',
      progress: 100,
      error: null,
      image: { id: 99, url: 'https://example.com/generated.jpg' },
    });

    const AiImageGenerator = await importComponent();
    const onRefresh = vi.fn();
    render(
      <AiImageGenerator
        productId="42"
        existingImages={MOCK_IMAGES}
        onRefresh={onRefresh}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: /select image.*1/i }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /generate with ai/i });
      if (btn.hasAttribute('disabled')) throw new Error('button still disabled');
    });

    vi.useFakeTimers();
    try {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3500);
      });
    } finally {
      vi.useRealTimers();
    }

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('hides control gracefully on 403 from POST', async () => {
    const err = Object.assign(new Error('Forbidden'), {
      response: { status: 403 },
    });
    mockSubmitAiImage.mockRejectedValue(err);

    const AiImageGenerator = await importComponent();
    render(
      <AiImageGenerator
        productId="42"
        existingImages={MOCK_IMAGES}
        onRefresh={vi.fn()}
      />
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole('radio', { name: /select image.*1/i }));
      const btn = screen.getByRole('button', { name: /generate with ai/i });
      if (btn.hasAttribute('disabled')) throw new Error('button still disabled');
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /generate with ai/i }));
    });

    await waitFor(() => {
      // After 403, the component should not render its main UI
      expect(screen.queryByRole('button', { name: /generate with ai/i })).toBeNull();
    });
  });
});
