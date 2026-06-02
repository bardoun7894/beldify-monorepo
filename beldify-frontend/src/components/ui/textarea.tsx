// /var/www/html/src/components/ui/textarea.tsx
import * as React from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility

// Using type alias instead of empty interface extension
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-900 ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 focus-visible:border-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 resize-y',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
