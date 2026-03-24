import React from 'react';
import { cn } from '../lib/utils';

/* -------------------------------------------------------------------------- */
/*  Separator                                                                  */
/* -------------------------------------------------------------------------- */

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ className, orientation = 'horizontal', ...props }: SeparatorProps) {
  return (
    <div
      role="separator"
      className={cn(
        'shrink-0 bg-[var(--color-border)]',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Skeleton (loading placeholder)                                             */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-[var(--radius-md)] bg-[var(--color-muted)]', className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Avatar                                                                     */
/* -------------------------------------------------------------------------- */

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };

export function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] font-medium',
        sizeMap[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt ?? fallback} className="aspect-square h-full w-full object-cover" />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
}

