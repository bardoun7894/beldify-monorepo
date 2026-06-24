// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AuthBrandPanel from '../auth/AuthBrandPanel';

describe('AuthBrandPanel', () => {
  it('renders the heading prop as h1', () => {
    render(
      <AuthBrandPanel
        heading="Welcome back to Beldify."
        subtext="Your wishlist is waiting."
      />
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('Welcome back to Beldify.');
  });

  it('renders the subtext prop text in the document', () => {
    render(
      <AuthBrandPanel
        heading="Welcome"
        subtext="Your wishlist is waiting."
      />
    );
    const subtextEls = screen.getAllByText(/Your wishlist is waiting\./);
    expect(subtextEls.length).toBeGreaterThan(0);
  });

  it('renders bullet points when provided', () => {
    render(
      <AuthBrandPanel
        heading="Welcome"
        subtext="Subtext here."
        bullets={['Verified sellers', 'Free returns']}
      />
    );
    const verified = screen.getByText('Verified sellers');
    const returns = screen.getByText('Free returns');
    expect(verified).toBeTruthy();
    expect(returns).toBeTruthy();
  });

  it('renders a link to the homepage', () => {
    render(
      <AuthBrandPanel
        heading="Welcome"
        subtext="Subtext."
      />
    );
    const links = screen.getAllByRole('link');
    const homeLink = links.find((l) => l.getAttribute('href') === '/');
    expect(homeLink).toBeTruthy();
  });

  it('includes Beldify wordmark text in the home link', () => {
    render(
      <AuthBrandPanel
        heading="Welcome"
        subtext="Subtext."
      />
    );
    const links = screen.getAllByRole('link');
    const homeLink = links.find((l) => l.getAttribute('href') === '/');
    expect(homeLink?.textContent).toContain('Beldify');
  });

  it('renders with indigo-950 background class on the root element', () => {
    const { container } = render(
      <AuthBrandPanel
        heading="Welcome"
        subtext="Subtext."
      />
    );
    const panel = container.firstChild as HTMLElement;
    expect(panel?.className).toContain('bg-indigo-950');
  });
});
