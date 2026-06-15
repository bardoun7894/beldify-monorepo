/**
 * @vitest-environment jsdom
 * TDD tests for T6: SearchSuggestions component
 *
 * Tests cover:
 * - Does NOT fetch when query < 2 chars
 * - Fetches suggestions on ≥2 chars of input (after debounce)
 * - Renders grouped product suggestions (with /products/{slug} links)
 * - Renders grouped category suggestions (with /categories/{slug} links)
 * - Shows "Products" section heading when product suggestions exist
 * - Shows trending section when data has trending terms
 * - Shows recent section when user authenticated + recent terms present
 * - Does NOT show recent when user is not authenticated
 * - Does NOT show recent when recent array is empty
 * - Shows nothing (no listbox) when fetch errors
 * - Shows nothing (no listbox) when fetch returns non-ok
 * - Shows nothing (no listbox) when suggestions array empty
 * - Renders listbox role when dropdown is open
 * - Suggestion items have option role
 * - ArrowDown highlights first option (aria-selected=true)
 * - Escape calls onClose
 * - Enter with no selection calls onSubmit with current query
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import SearchSuggestions from '@/components/search/SearchSuggestions';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === 'string' ? fallback : key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

let mockUser: { id: number } | null = null;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: false }),
}));

// ── Fixture data ──────────────────────────────────────────────────────────────

const SUGGESTIONS_RESPONSE = {
  suggestions: [
    { type: 'product', label: 'Caftan rouge', slug: 'caftan-rouge' },
    { type: 'product', label: 'Djellaba bleue', slug: 'djellaba-bleue' },
    { type: 'category', label: 'Jewelry', slug: 'jewelry' },
  ],
  trending: ['caftan', 'djellaba', 'babouche'],
  recent: [],
};

const SUGGESTIONS_WITH_RECENT = {
  ...SUGGESTIONS_RESPONSE,
  recent: ['caftan mariage', 'jellaba homme'],
};

// ── Fetch mock helpers ────────────────────────────────────────────────────────

function setupFetchOk(data: object) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  }));
}

function setupFetchError() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
}

function setupFetchNotOk() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({}),
  }));
}

// ── Render helper ─────────────────────────────────────────────────────────────

function renderComponent(props: {
  query?: string;
  onQueryChange?: (q: string) => void;
  onSubmit?: (q: string) => void;
  onClose?: () => void;
} = {}) {
  const defaults = {
    query: '',
    onQueryChange: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };
  const merged = { ...defaults, ...props };
  render(<SearchSuggestions {...merged} />);
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('SearchSuggestions — T6 typeahead', () => {
  beforeEach(() => {
    mockUser = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Short query: no fetch, no dropdown ───────────────────────────────────

  it('does NOT render dropdown when query is shorter than 2 chars', () => {
    setupFetchOk(SUGGESTIONS_RESPONSE);
    renderComponent({ query: 'c' });
    // No listbox should appear immediately for short queries
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does NOT call fetch when query is 1 char', () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(SUGGESTIONS_RESPONSE) });
    vi.stubGlobal('fetch', fetchMock);
    // debounceMs=0 but query is too short — fetch should never be called
    render(
      <SearchSuggestions
        query="c"
        onQueryChange={vi.fn()}
        onSubmit={vi.fn()}
        debounceMs={0}
      />
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Helper: render with debounceMs=0 for instant fetch
  function q(props: { query: string; onQueryChange?: (q: string) => void; onSubmit?: (q: string) => void; onClose?: () => void }) {
    return render(
      <SearchSuggestions
        query={props.query}
        onQueryChange={props.onQueryChange ?? vi.fn()}
        onSubmit={props.onSubmit ?? vi.fn()}
        onClose={props.onClose ?? vi.fn()}
        debounceMs={0}
      />
    );
  }

  // ── Suggestions rendering ────────────────────────────────────────────────

  it('renders a listbox when fetch resolves with suggestions', async () => {
    setupFetchOk(SUGGESTIONS_RESPONSE);
    q({ query: 'ca' });
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders product suggestions with links to /products/{slug}', async () => {
    setupFetchOk(SUGGESTIONS_RESPONSE);
    q({ query: 'ca' });
    await waitFor(() => {
      expect(screen.getByText('Caftan rouge')).toBeInTheDocument();
    }, { timeout: 3000 });
    const link = screen.getByText('Caftan rouge').closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('caftan-rouge'));
  });

  it('renders category suggestions with links to /categories/{slug}', async () => {
    setupFetchOk(SUGGESTIONS_RESPONSE);
    q({ query: 'je' });
    await waitFor(() => {
      expect(screen.getByText('Jewelry')).toBeInTheDocument();
    }, { timeout: 3000 });
    const link = screen.getByText('Jewelry').closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('/categories/jewelry'));
  });

  it('shows a "Products" section heading when product suggestions exist', async () => {
    setupFetchOk(SUGGESTIONS_RESPONSE);
    q({ query: 'ca' });
    await waitFor(() => {
      expect(screen.getByText(/products/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('suggestion items have option role', async () => {
    setupFetchOk(SUGGESTIONS_RESPONSE);
    q({ query: 'ca' });
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  // ── Trending ────────────────────────────────────────────────────────────

  it('renders trending section heading when data has trending terms', async () => {
    setupFetchOk(SUGGESTIONS_RESPONSE);
    q({ query: 'ca' });
    await waitFor(() => {
      expect(screen.getByText(/trending/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders trending terms from suggestions response', async () => {
    setupFetchOk(SUGGESTIONS_RESPONSE);
    q({ query: 'ca' });
    await waitFor(() => {
      expect(screen.getByText('caftan')).toBeInTheDocument();
      expect(screen.getByText('djellaba')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // ── Recent (auth-gated) ─────────────────────────────────────────────────

  it('renders recent section when user authenticated and recent terms exist', async () => {
    mockUser = { id: 1 };
    setupFetchOk(SUGGESTIONS_WITH_RECENT);
    q({ query: 'ca' });
    await waitFor(() => {
      expect(screen.getByText('caftan mariage')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('does NOT show recent section when user is not authenticated', async () => {
    mockUser = null;
    setupFetchOk(SUGGESTIONS_WITH_RECENT);
    q({ query: 'ca' });
    await waitFor(() => {
      expect(screen.getByText('Caftan rouge')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.queryByText('caftan mariage')).not.toBeInTheDocument();
  });

  it('does NOT show recent section when recent array is empty', async () => {
    mockUser = { id: 1 };
    setupFetchOk(SUGGESTIONS_RESPONSE); // recent: []
    q({ query: 'ca' });
    await waitFor(() => {
      expect(screen.getByText('Caftan rouge')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.queryByText(/recent/i)).not.toBeInTheDocument();
  });

  // ── Graceful degradation ─────────────────────────────────────────────────

  it('shows no listbox when fetch errors', async () => {
    setupFetchError();
    q({ query: 'ca' });
    await new Promise((r) => setTimeout(r, 200));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows no listbox when fetch returns non-ok status', async () => {
    setupFetchNotOk();
    q({ query: 'ca' });
    await new Promise((r) => setTimeout(r, 200));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows no listbox when suggestions array is empty', async () => {
    setupFetchOk({ suggestions: [], trending: [], recent: [] });
    q({ query: 'xyzqabcnothing' });
    await new Promise((r) => setTimeout(r, 200));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // ── Keyboard navigation ───────────────────────────────────────────────────

  it('sets aria-selected=true on first option after ArrowDown', async () => {
    setupFetchOk(SUGGESTIONS_RESPONSE);
    q({ query: 'ca' });
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    }, { timeout: 3000 });
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onClose when Escape is pressed', async () => {
    setupFetchOk(SUGGESTIONS_RESPONSE);
    const onClose = vi.fn();
    q({ query: 'ca', onClose });
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSubmit with current query on Enter with no active selection', async () => {
    setupFetchOk(SUGGESTIONS_RESPONSE);
    const onSubmit = vi.fn();
    q({ query: 'caftan', onSubmit });
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    }, { timeout: 3000 });
    // Enter with no active item (activeIndex starts at -1)
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('caftan');
  });
});
