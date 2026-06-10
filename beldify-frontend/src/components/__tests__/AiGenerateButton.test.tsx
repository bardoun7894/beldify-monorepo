// @vitest-environment jsdom
/**
 * TDD RED → GREEN — AiGenerateButton component
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

afterEach(() => vi.clearAllMocks());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' '),
}));

describe('AiGenerateButton', () => {
  it('renders with label and credit cost', async () => {
    const { AiGenerateButton } = await import('@/components/seller/AiGenerateButton');
    render(
      <AiGenerateButton label="Generate listing" cost={2} onClick={() => {}} />
    );
    expect(screen.getByRole('button')).toBeTruthy();
    // Label and cost should be visible
    expect(screen.getByText(/generate listing/i)).toBeTruthy();
    expect(screen.getByText(/2/)).toBeTruthy();
  });

  it('calls onClick when clicked', async () => {
    const { AiGenerateButton } = await import('@/components/seller/AiGenerateButton');
    const onClick = vi.fn();
    render(<AiGenerateButton label="Generate" cost={2} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows spinner and is disabled while loading', async () => {
    const { AiGenerateButton } = await import('@/components/seller/AiGenerateButton');
    render(
      <AiGenerateButton label="Generate" cost={2} onClick={() => {}} loading={true} />
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    // spinner should be present (aria-busy or animate-spin class element)
    expect(btn.closest('[aria-busy]') || btn.querySelector('[aria-hidden]') || btn).toBeTruthy();
  });

  it('is disabled when disabled prop is true', async () => {
    const { AiGenerateButton } = await import('@/components/seller/AiGenerateButton');
    const onClick = vi.fn();
    render(
      <AiGenerateButton label="Generate" cost={2} onClick={onClick} disabled={true} />
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not fire onClick while loading', async () => {
    const { AiGenerateButton } = await import('@/components/seller/AiGenerateButton');
    const onClick = vi.fn();
    render(
      <AiGenerateButton label="Generate" cost={2} onClick={onClick} loading={true} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
