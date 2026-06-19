import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card — Atlas surface primitive.
 *
 * Neutral white surface with the indigo-tinted Atlas shadow and a 16px radius,
 * matching the storefront/admin card language. Logical `text-start` default so
 * it reads correctly in both LTR and RTL (ar / ma). Optional Header/Body/Footer
 * subcomponents give consistent internal padding + hairline separators.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-card text-card-foreground rounded-2xl shadow-atlas-sm ring-1 ring-gray-200 text-start',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-5 py-4 border-b border-gray-100', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5', className)} {...props} />
  )
);
CardBody.displayName = 'CardBody';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-5 py-4 border-t border-gray-100', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter };
