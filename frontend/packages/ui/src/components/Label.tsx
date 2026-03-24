import React, { forwardRef, type LabelHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none text-[var(--color-foreground)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

export interface LabelProps
  extends LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

/**
 * Label — themed form label.
 *
 * @example
 * ```tsx
 * <Label htmlFor="title">Page Title</Label>
 * <Input id="title" />
 * ```
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants(), className)}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';

