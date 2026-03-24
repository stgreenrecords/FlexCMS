import React, { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input — themed text input field.
 *
 * @example
 * ```tsx
 * <Input type="text" placeholder="Enter page title..." />
 * <Input type="email" disabled />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] ring-offset-[var(--color-background)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

