'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Using the React.InputHTMLAttributes directly instead of an empty interface extension
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 focus-visible:border-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
