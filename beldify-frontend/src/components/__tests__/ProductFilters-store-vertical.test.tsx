/**
 * @vitest-environment jsdom
 * TDD — RED phase for T8: store + vertical facet filters in ProductFilters
 *
 * Tests cover:
 * - Renders "Store/Seller" group from facets.stores with counts
 * - Renders "Type/Vertical" group from facets.verticals with counts
 * - Hides store group when facets.stores absent
 * - Hides vertical group when facets.verticals absent
 * - Vertical labels rendered via i18n (jewelry→"مجوهرات", tailor→"خياطة")
 * - Clicking store option calls onChange with store_id param
 * - Clicking vertical option calls onChange with vertical param
 * - "Show more" collapses long store lists (top N + expand button)
 * - RTL-safe (uses logical props / dir-agnostic layout)
 * - Counts shown next to each option
 * - Graceful when facets entirely absent
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import ProductFilters from '@/components/products/ProductFilters';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      // Simulate vertical i18n translations
      const verticalMap: Record<string, string> = {
        'facet_filters.vertical.jewelry': 'مجوهرات',
        'facet_filters.vertical.tailor': 'خياطة',
        'facet_filters.vertical.fabric': 'أقمشة',
        'facet_filters.stores': 'Store / Seller',
        'facet_filters.verticals': 'Type / Vertical',
        'facet_filters.show_more': 'Show more',
        'facet_filters.show_less': 'Show less',
      };
      return verticalMap[key] ?? fallback ?? key;
    },
    i18n: { language: 'en' },
  }),
}));

// headlessui stubs — Dialog/Transition render children directly for tests
vi.mock('@headlessui/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@headlessui/react')>();
  return {
    ...actual,
    Transition: ({ show, children }: { show?: boolean; children: React.ReactNode }) =>
      show !== false ? <>{children}</> : null,
    Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// ── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_FILTERS = {
  colors: [],
  sizes: [],
  fabrics: [],
  store_ids: [] as number[],
  verticals: [] as string[],
};

const FACETS = {
  stores: [
    { id: 1, name: 'Atelier Marrakech', count: 42 },
    { id: 2, name: 'Fassi Crafts', count: 18 },
    { id: 3, name: 'Casablanca Couture', count: 7 },
  ],
  verticals: [
    { slug: 'jewelry', count: 120 },
    { slug: 'tailor', count: 85 },
    { slug: 'fabric', count: 34 },
  ],
};

const MANY_STORES_FACETS = {
  stores: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Store ${i + 1}`,
    count: 10 - i,
  })),
  verticals: [],
};

// ── Render helper ─────────────────────────────────────────────────────────────

function renderFilters(
  overrides: Partial<typeof BASE_FILTERS> = {},
  facets?: typeof FACETS | null
) {
  const filters = { ...BASE_FILTERS, ...overrides };
  const onChange = vi.fn();
  render(
    <ProductFilters
      filters={filters}
      onChange={onChange}
      facets={facets ?? undefined}
    />
  );
  return { onChange };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('ProductFilters — T8 store + vertical facets', () => {

  // ── Store group ───────────────────────────────────────────────────────────

  it('renders "Store / Seller" filter section when facets.stores is provided', () => {
    renderFilters({}, FACETS);
    expect(screen.getByText('Store / Seller')).toBeInTheDocument();
  });

  it('renders each store name with its count', () => {
    renderFilters({}, FACETS);
    expect(screen.getByText('Atelier Marrakech')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Fassi Crafts')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('hides "Store / Seller" section when facets.stores is absent', () => {
    renderFilters({}, { stores: undefined as any, verticals: [] });
    expect(screen.queryByText('Store / Seller')).not.toBeInTheDocument();
  });

  it('hides "Store / Seller" section when facets itself is absent', () => {
    renderFilters({}, null);
    expect(screen.queryByText('Store / Seller')).not.toBeInTheDocument();
  });

  it('clicking a store option calls onChange with store_ids containing that id', () => {
    const { onChange } = renderFilters({}, FACETS);
    const storeLabel = screen.getByText('Atelier Marrakech');
    // The clickable element is the label or its wrapper
    fireEvent.click(storeLabel);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ store_ids: expect.arrayContaining([1]) })
    );
  });

  it('clicking a selected store removes it from store_ids', () => {
    const { onChange } = renderFilters({ store_ids: [1] }, FACETS);
    const storeLabel = screen.getByText('Atelier Marrakech');
    fireEvent.click(storeLabel);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ store_ids: expect.not.arrayContaining([1]) })
    );
  });

  // ── Show more / collapse ──────────────────────────────────────────────────

  it('shows "Show more" button when store list exceeds the collapsed limit', () => {
    renderFilters({}, MANY_STORES_FACETS as any);
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  it('shows all stores after clicking "Show more"', () => {
    renderFilters({}, MANY_STORES_FACETS as any);
    fireEvent.click(screen.getByText('Show more'));
    // All 10 stores should be visible now
    expect(screen.getByText('Store 8')).toBeInTheDocument();
    expect(screen.getByText('Store 9')).toBeInTheDocument();
    expect(screen.getByText('Store 10')).toBeInTheDocument();
  });

  it('shows "Show less" button after expanding', () => {
    renderFilters({}, MANY_STORES_FACETS as any);
    fireEvent.click(screen.getByText('Show more'));
    expect(screen.getByText('Show less')).toBeInTheDocument();
  });

  // ── Vertical group ────────────────────────────────────────────────────────

  it('renders "Type / Vertical" filter section when facets.verticals is provided', () => {
    renderFilters({}, FACETS);
    expect(screen.getByText('Type / Vertical')).toBeInTheDocument();
  });

  it('renders vertical labels translated via i18n', () => {
    renderFilters({}, FACETS);
    // jewelry → 'مجوهرات', tailor → 'خياطة'
    expect(screen.getByText('مجوهرات')).toBeInTheDocument();
    expect(screen.getByText('خياطة')).toBeInTheDocument();
  });

  it('renders vertical counts next to each label', () => {
    renderFilters({}, FACETS);
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('hides "Type / Vertical" section when facets.verticals is absent', () => {
    renderFilters({}, { stores: [], verticals: undefined as any });
    expect(screen.queryByText('Type / Vertical')).not.toBeInTheDocument();
  });

  it('hides "Type / Vertical" section when facets.verticals is empty array', () => {
    renderFilters({}, { ...FACETS, verticals: [] });
    expect(screen.queryByText('Type / Vertical')).not.toBeInTheDocument();
  });

  it('clicking a vertical option calls onChange with verticals containing that slug', () => {
    const { onChange } = renderFilters({}, FACETS);
    const verticalLabel = screen.getByText('مجوهرات');
    fireEvent.click(verticalLabel);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ verticals: expect.arrayContaining(['jewelry']) })
    );
  });

  it('clicking a selected vertical removes it from verticals', () => {
    const { onChange } = renderFilters({ verticals: ['jewelry'] }, FACETS);
    const verticalLabel = screen.getByText('مجوهرات');
    fireEvent.click(verticalLabel);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ verticals: expect.not.arrayContaining(['jewelry']) })
    );
  });

  // ── Graceful when no facets ───────────────────────────────────────────────

  it('renders without crashing when facets is undefined', () => {
    expect(() => renderFilters({}, undefined)).not.toThrow();
  });

  it('still renders existing filter groups (price, colors, sizes) when facets absent', () => {
    renderFilters({}, undefined);
    // The component still renders price / colors / sizes / fabrics regardless of facets
    expect(screen.getByText(/price range/i)).toBeInTheDocument();
  });
});
