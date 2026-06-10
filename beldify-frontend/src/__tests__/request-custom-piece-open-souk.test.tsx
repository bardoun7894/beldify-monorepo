// @vitest-environment jsdom
/**
 * RequestCustomPieceForm — Open Souk custom-piece request.
 *
 * Proves the product requirements:
 *  - Material is the ONLY required field (submit blocked without it)
 *  - Everything else optional: submit succeeds with only Material
 *  - Posts to Open Souk via createCommunityPost with auto-filled
 *    title / description / category_id + product_specifications[material]
 *  - Image files are appended as images[]
 *  - Unauthenticated users are redirected to login
 *
 * Implementation notes:
 *  - Material selection is via chip buttons (not a <select>); the label
 *    "Material" is not associated with a form control via htmlFor.
 *    Tests interact with the chip buttons directly by their text label.
 *  - Validation is in JS (not native HTML `required`); the submit handler
 *    sets an error state and returns early when no material is selected.
 *  - framer-motion is mocked to avoid AnimatePresence incompatibilities in jsdom.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// jsdom has no object-URL impl — stub it for image previews.
(globalThis.URL as unknown as { createObjectURL: () => string }).createObjectURL = () => 'blob:mock';

const pushMock = vi.fn();
let authed = true;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (_k: string, d?: string) => d ?? _k }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: authed, loading: false }),
}));

const createCommunityPostMock = vi.fn().mockResolvedValue({ id: 99 });
vi.mock('@/services/communityService', () => ({
  createCommunityPost: (fd: FormData) => createCommunityPostMock(fd),
}));

vi.mock('@/services/categoryService', () => ({
  categoryService: {
    getAllCategories: vi.fn().mockResolvedValue([
      { id: 3, slug: 'jewelry', name_en: 'Jewelry', name_ar: 'مجوهرات', parent_id: null },
      { id: 1, slug: 'other', name_en: 'Other', name_ar: '', parent_id: null },
    ]),
  },
}));

vi.mock('@/utils/toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

// Mock framer-motion to avoid AnimatePresence/motion issues in jsdom.
// motion.div becomes a plain <div>; AnimatePresence renders children directly.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: React.ComponentProps<'div'>) =>
      React.createElement('div', rest, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

import RequestCustomPieceForm from '@/components/community/RequestCustomPieceForm';

describe('RequestCustomPieceForm (Open Souk)', () => {
  beforeEach(() => {
    authed = true;
    pushMock.mockClear();
    createCommunityPostMock.mockClear();
  });

  it('does not post when Material is missing (the only required field)', async () => {
    render(<RequestCustomPieceForm />);
    // Material is presented as chip buttons — no form control with a label.
    // Verify the chip buttons are rendered (at least "Gold" is visible).
    await waitFor(() => expect(screen.getByRole('button', { name: /gold/i })).toBeInTheDocument());

    // Click submit without selecting a material.
    fireEvent.click(screen.getByRole('button', { name: /post to open souk/i }));

    // The submit handler checks `if (!material)` and sets error — it never calls createCommunityPost.
    await new Promise((r) => setTimeout(r, 0));
    expect(createCommunityPostMock).not.toHaveBeenCalled();
    // An error message should appear.
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('submits with ONLY Material chosen, auto-filling title/description/category + specs', async () => {
    render(<RequestCustomPieceForm />);
    // Wait for categories to load (async useEffect).
    await waitFor(() => expect(screen.getByRole('button', { name: /gold/i })).toBeInTheDocument());

    // Select "Gold" chip — this sets material state.
    fireEvent.click(screen.getByRole('button', { name: /gold/i }));
    fireEvent.click(screen.getByRole('button', { name: /post to open souk/i }));

    await waitFor(() => expect(createCommunityPostMock).toHaveBeenCalledTimes(1));
    const fd = createCommunityPostMock.mock.calls[0][0] as FormData;
    expect((fd.get('title') as string).length).toBeGreaterThanOrEqual(5);
    expect((fd.get('description') as string).length).toBeGreaterThanOrEqual(20);
    expect(fd.get('category_id')).toBe('3'); // resolved to the Jewelry category
    expect(fd.get('currency')).toBe('MAD');
    expect(fd.get('product_specifications[material]')).toBe('gold');

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/community/posts/99'));
  });

  it('appends uploaded images as images[]', async () => {
    render(<RequestCustomPieceForm />);
    await waitFor(() => expect(screen.getByRole('button', { name: /silver/i })).toBeInTheDocument());

    // Select "Silver" chip.
    fireEvent.click(screen.getByRole('button', { name: /silver/i }));

    const file = new File(['x'], 'ref.png', { type: 'image/png' });
    const input = document.getElementById('images') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /post to open souk/i }));

    await waitFor(() => expect(createCommunityPostMock).toHaveBeenCalled());
    const fd = createCommunityPostMock.mock.calls[0][0] as FormData;
    expect(fd.getAll('images[]').length).toBe(1);
  });

  it('redirects unauthenticated users to login', async () => {
    authed = false;
    render(<RequestCustomPieceForm />);
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login?redirect=/custom-orders/new'));
  });
});
