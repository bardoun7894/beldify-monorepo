import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge — Atlas status pill.
 *
 * Five semantic variants mapped to light, on-palette tints:
 *   success → emerald   info → indigo   warn → amber
 *   error   → rose      neutral → slate (default)
 *
 * Deliberately avoids off-palette `blue-*`: shipped/approved states that used
 * to be blue now map to `info` (indigo) so badges stay inside the Atlas palette.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        success: 'bg-emerald-100 text-emerald-800',
        info: 'bg-indigo-100 text-indigo-800',
        warn: 'bg-amber-100 text-amber-800',
        error: 'bg-rose-100 text-rose-800',
        neutral: 'bg-slate-100 text-slate-700',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
