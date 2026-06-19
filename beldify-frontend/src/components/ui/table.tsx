import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Table — Atlas data-table primitive.
 *
 * The root `Table` wraps the <table> in an `overflow-x-auto` container so wide
 * tables scroll on mobile instead of breaking the layout. All cells default to
 * logical `text-start` alignment (correct in both LTR and RTL). Numeric columns
 * opt in to `tabular-nums` + `text-end` via the `numeric` prop on TableHead /
 * TableCell, so MAD price columns line up and read right-aligned per locale.
 */

const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="overflow-x-auto">
      <table ref={ref} className={cn('w-full text-sm', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={className} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('divide-y divide-gray-100', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn('transition-colors', className)} {...props} />
));
TableRow.displayName = 'TableRow';

interface TableCellBaseProps {
  /** Right-align + tabular-nums for numeric columns (MAD prices, counts). */
  numeric?: boolean;
}

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & TableCellBaseProps
>(({ className, numeric, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'px-5 py-3 font-medium text-xs uppercase tracking-wide text-gray-400',
      numeric ? 'text-end tabular-nums' : 'text-start',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & TableCellBaseProps
>(({ className, numeric, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'px-5 py-3',
      numeric ? 'text-end tabular-nums' : 'text-start',
      className
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
