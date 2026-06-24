import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-[calc(1rem-4px)] text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        // Primary (default): Atlas Indigo for main CTAs (primary brand action)
        default: 'bg-indigo-700 text-white hover:bg-indigo-800 shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5',
        // Accent: Saffron Amber for add-to-cart, call-to-action highlights
        accent: 'bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5',
        // Secondary: kept for backward compat — same as default (indigo), existing consumers unaffected
        secondary: 'bg-indigo-700 text-white hover:bg-indigo-800 shadow-atlas-sm hover:shadow-atlas-md hover:-translate-y-0.5',
        // Destructive: Rose-700 (Tetouani Garnet — error/sale states only)
        destructive: 'bg-rose-700 text-white hover:bg-rose-800 shadow-sm hover:shadow-md',
        // Outline: Bordered indigo for secondary actions
        outline: 'border-2 border-indigo-700 bg-white text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 shadow-sm hover:shadow-md',
        // Ghost: Subtle amber-tinted hover
        ghost: 'hover:bg-amber-50 hover:text-indigo-700',
        // Link: Text-only indigo
        link: 'text-indigo-700 underline-offset-4 hover:underline hover:text-indigo-800',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-lg px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
