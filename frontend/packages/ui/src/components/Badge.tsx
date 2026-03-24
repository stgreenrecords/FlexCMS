import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
        secondary: 'border-transparent bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
        destructive: 'border-transparent bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)]',
        outline: 'text-[var(--color-foreground)]',
        success: 'border-transparent bg-emerald-500 text-white',
        warning: 'border-transparent bg-amber-500 text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge — themed status indicator / tag.
 *
 * @example
 * ```tsx
 * <Badge>Published</Badge>
 * <Badge variant="warning">Draft</Badge>
 * <Badge variant="destructive">Archived</Badge>
 * ```
 */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

