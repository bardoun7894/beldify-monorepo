// @vitest-environment jsdom
/**
 * TDD — Card primitive (B2)
 *
 * Card is an Atlas surface: bg-card, rounded-2xl, shadow-atlas-sm,
 * logical padding, text-start. Header/Body/Footer subcomponents.
 */
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => cleanup());

describe('Card primitive', () => {
  it('renders children', async () => {
    const { Card } = await import('@/components/ui/card');
    render(<Card>hello</Card>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('applies Atlas surface tokens (bg-card, rounded-2xl, shadow-atlas-sm)', async () => {
    const { Card } = await import('@/components/ui/card');
    render(<Card data-testid="c">x</Card>);
    const el = screen.getByTestId('c');
    expect(el.className).toContain('bg-card');
    expect(el.className).toContain('rounded-2xl');
    expect(el.className).toContain('shadow-atlas-sm');
  });

  it('defaults to logical text-start alignment', async () => {
    const { Card } = await import('@/components/ui/card');
    render(<Card data-testid="c">x</Card>);
    expect(screen.getByTestId('c').className).toContain('text-start');
  });

  it('merges custom className', async () => {
    const { Card } = await import('@/components/ui/card');
    render(<Card data-testid="c" className="mt-4">x</Card>);
    expect(screen.getByTestId('c').className).toContain('mt-4');
  });

  it('exposes CardHeader, CardBody and CardFooter subcomponents', async () => {
    const mod = await import('@/components/ui/card');
    expect(mod.CardHeader).toBeDefined();
    expect(mod.CardBody).toBeDefined();
    expect(mod.CardFooter).toBeDefined();
    render(
      <mod.Card>
        <mod.CardHeader>head</mod.CardHeader>
        <mod.CardBody>body</mod.CardBody>
        <mod.CardFooter>foot</mod.CardFooter>
      </mod.Card>
    );
    expect(screen.getByText('head')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
    expect(screen.getByText('foot')).toBeInTheDocument();
  });
});
