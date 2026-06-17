/**
 * NoSearchResults — Spec 010 T12 (frontend): did-you-mean + Open Souk cross-link.
 */
// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// i18n stub — returns the fallback, with {{var}} interpolation.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string, opts?: Record<string, unknown>) => {
      let s = typeof fallback === 'string' ? fallback : _key;
      if (opts) {
        for (const k of Object.keys(opts)) {
          s = s.replace(`{{${k}}}`, String(opts[k]));
        }
      }
      return s;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : ''} {...rest}>
      {children}
    </a>
  ),
}));

import NoSearchResults from '../NoSearchResults';

describe('NoSearchResults — did you mean (T10) + Open Souk cross-link (T12)', () => {
  it('renders a did-you-mean link to the corrected query', () => {
    render(<NoSearchResults query="qaftn" didYouMean="qaftan" />);
    const link = screen.getByRole('link', { name: 'qaftan' });
    expect(link.getAttribute('href')).toBe('/products?q=qaftan');
  });

  it('does not render the did-you-mean line when none is provided', () => {
    render(<NoSearchResults query="xyz" />);
    expect(screen.queryByText('Did you mean')).toBeNull();
  });

  it('lists matching open Open Souk requests linking to the post', () => {
    render(
      <NoSearchResults
        query="amazigh"
        openSoukMatches={[
          { id: 7, title: 'Handmade amazigh necklace', response_count: 3 },
          { id: 9, title: 'Vintage berber rug', response_count: 0 },
        ]}
      />,
    );
    const link = screen.getByRole('link', { name: /Handmade amazigh necklace/ });
    expect(link.getAttribute('href')).toBe('/community/posts/7');
    expect(screen.getByText(/Vintage berber rug/)).toBeTruthy();
  });

  it('omits the matches section when there are none', () => {
    render(<NoSearchResults query="xyz" openSoukMatches={[]} />);
    expect(screen.queryByText('People are looking for this too')).toBeNull();
  });
});
