// @vitest-environment jsdom
/**
 * TDD — Badge primitive (B2)
 *
 * Variants: success / info / warn / error / neutral mapped to
 * emerald / indigo / amber / rose / slate tints (light, on-palette).
 */
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => cleanup());

describe('Badge primitive', () => {
  it('renders its children', async () => {
    const { Badge } = await import('@/components/ui/badge');
    render(<Badge>Shipped</Badge>);
    expect(screen.getByText('Shipped')).toBeInTheDocument();
  });

  it('defaults to the neutral (slate) variant', async () => {
    const { Badge } = await import('@/components/ui/badge');
    render(<Badge data-testid="b">x</Badge>);
    expect(screen.getByTestId('b').className).toContain('slate');
  });

  it('success variant uses emerald tint', async () => {
    const { Badge } = await import('@/components/ui/badge');
    render(<Badge data-testid="b" variant="success">ok</Badge>);
    expect(screen.getByTestId('b').className).toContain('emerald');
  });

  it('info variant uses indigo tint', async () => {
    const { Badge } = await import('@/components/ui/badge');
    render(<Badge data-testid="b" variant="info">i</Badge>);
    expect(screen.getByTestId('b').className).toContain('indigo');
  });

  it('warn variant uses amber tint', async () => {
    const { Badge } = await import('@/components/ui/badge');
    render(<Badge data-testid="b" variant="warn">w</Badge>);
    expect(screen.getByTestId('b').className).toContain('amber');
  });

  it('error variant uses rose tint', async () => {
    const { Badge } = await import('@/components/ui/badge');
    render(<Badge data-testid="b" variant="error">e</Badge>);
    expect(screen.getByTestId('b').className).toContain('rose');
  });

  it('does not use off-palette blue', async () => {
    const { Badge } = await import('@/components/ui/badge');
    const mod = await import('@/components/ui/badge');
    // Render every variant and assert none emit a blue-* class
    for (const v of ['success', 'info', 'warn', 'error', 'neutral'] as const) {
      const { container } = render(<mod.Badge variant={v}>x</mod.Badge>);
      expect(container.innerHTML).not.toMatch(/\bbg-blue-|\btext-blue-/);
      cleanup();
    }
    expect(typeof Badge).toBe('object'); // forwardRef object
  });
});
