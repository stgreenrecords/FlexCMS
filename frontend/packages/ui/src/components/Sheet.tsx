import React, { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Sheet is a Dialog that slides in from an edge (left / right / bottom)
// ---------------------------------------------------------------------------

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

export const SheetOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

// ---------------------------------------------------------------------------
// Content — slide direction variants
// ---------------------------------------------------------------------------

const sheetContentVariants = cva(
  [
    'fixed z-50 flex flex-col gap-4',
    'bg-[var(--color-card)]',
    'border-[var(--color-border)]',
    'shadow-lg',
    'transition ease-in-out',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:duration-300 data-[state=open]:duration-500',
  ],
  {
    variants: {
      side: {
        right: [
          'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l p-6',
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        ],
        left: [
          'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r p-6',
          'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        ],
        bottom: [
          'inset-x-0 bottom-0 h-auto max-h-[85vh] border-t p-6 rounded-t-[var(--radius-lg)]',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        ],
        top: [
          'inset-x-0 top-0 h-auto max-h-[85vh] border-b p-6 rounded-b-[var(--radius-lg)]',
          'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        ],
      },
    },
    defaultVariants: { side: 'right' },
  }
);

export interface SheetContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetContentVariants> {}

export const SheetContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, side, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(sheetContentVariants({ side }), className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          'absolute right-4 top-4 rounded-[var(--radius-sm)]',
          'text-[var(--color-muted-foreground)]',
          'opacity-70 ring-offset-[var(--color-background)]',
          'transition-opacity hover:opacity-100',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2',
          'disabled:pointer-events-none',
        )}
      >
        <CloseIcon />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

// ---------------------------------------------------------------------------
// Semantic sub-components
// ---------------------------------------------------------------------------

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

export const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

export const SheetTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-[var(--color-card-foreground)]', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--color-muted-foreground)]', className)}
    {...props}
  />
));
SheetDescription.displayName = 'SheetDescription';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
