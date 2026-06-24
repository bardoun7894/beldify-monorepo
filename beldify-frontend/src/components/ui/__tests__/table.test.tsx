// @vitest-environment jsdom
/**
 * TDD — Table primitive (B2)
 *
 * Logical text-start default, tabular-nums on numeric cells, wrapped in
 * overflow-x-auto for mobile.
 */
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => cleanup());

describe('Table primitive', () => {
  it('renders a table element wrapped in an overflow-x-auto container', async () => {
    const { Table, TableBody, TableRow, TableCell } = await import('@/components/ui/table');
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>a</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const wrapper = container.querySelector('.overflow-x-auto');
    expect(wrapper).not.toBeNull();
    expect(container.querySelector('table')).not.toBeNull();
    expect(screen.getByText('a')).toBeInTheDocument();
  });

  it('header cells default to logical text-start alignment', async () => {
    const { Table, TableHeader, TableRow, TableHead } = await import('@/components/ui/table');
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead data-testid="th">Order</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByTestId('th').className).toContain('text-start');
  });

  it('numeric cells apply tabular-nums and text-end via the numeric prop', async () => {
    const { Table, TableBody, TableRow, TableCell } = await import('@/components/ui/table');
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell data-testid="td" numeric>1200</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const cell = screen.getByTestId('td');
    expect(cell.className).toContain('tabular-nums');
    expect(cell.className).toContain('text-end');
  });

  it('does not use the literal LTR utility text-left on headers', async () => {
    const { Table, TableHeader, TableRow, TableHead } = await import('@/components/ui/table');
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>X</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(container.innerHTML).not.toMatch(/text-left|text-right/);
  });
});
