// @vitest-environment jsdom
/**
 * TDD — Dialog/Sheet primitive (B2)
 *
 * Dependency-free (no @radix-ui/react-dialog): createPortal + focus-trap +
 * Escape-to-close + body scroll-lock + backdrop click-to-close.
 * Accessible: role="dialog", aria-modal="true".
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

describe('Dialog primitive', () => {
  it('renders nothing when open=false', async () => {
    const { Dialog } = await import('@/components/ui/dialog');
    render(<Dialog open={false} onClose={() => {}}>hi</Dialog>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders an accessible dialog when open=true', async () => {
    const { Dialog } = await import('@/components/ui/dialog');
    render(<Dialog open onClose={() => {}}>panel content</Dialog>);
    const dlg = screen.getByRole('dialog');
    expect(dlg).toBeInTheDocument();
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('panel content')).toBeInTheDocument();
  });

  it('locks body scroll while open and restores on close', async () => {
    const { Dialog } = await import('@/components/ui/dialog');
    const { rerender } = render(<Dialog open onClose={() => {}}>x</Dialog>);
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<Dialog open={false} onClose={() => {}}>x</Dialog>);
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('calls onClose when Escape is pressed', async () => {
    const { Dialog } = await import('@/components/ui/dialog');
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose}>x</Dialog>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const { Dialog } = await import('@/components/ui/dialog');
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose}>x</Dialog>);
    const backdrop = screen.getByTestId('dialog-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when the panel itself is clicked', async () => {
    const { Dialog } = await import('@/components/ui/dialog');
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose}><button>inside</button></Dialog>);
    fireEvent.click(screen.getByText('inside'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('moves focus into the panel on open (focus-trap)', async () => {
    const { Dialog } = await import('@/components/ui/dialog');
    render(<Dialog open onClose={() => {}}><button>first</button></Dialog>);
    const panel = screen.getByRole('dialog');
    // focus must be within the dialog panel
    expect(panel.contains(document.activeElement)).toBe(true);
  });

  it('supports a sheet variant anchored to an edge', async () => {
    const { Dialog } = await import('@/components/ui/dialog');
    render(<Dialog open onClose={() => {}} variant="sheet" side="bottom" data-testid="sheet">x</Dialog>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
