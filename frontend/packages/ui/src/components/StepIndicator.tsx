'use client';

import React from 'react';
import { cn } from '../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Step {
  id: string;
  label: string;
  description?: string;
  /** Override icon for completed step (default: ✓) */
  icon?: React.ReactNode;
}

export type StepStatus = 'completed' | 'current' | 'upcoming';

// ---------------------------------------------------------------------------
// StepIndicator variants
// ---------------------------------------------------------------------------

export const stepCircleVariants = cva(
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors border-2',
  {
    variants: {
      status: {
        completed: 'bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-foreground)]',
        current:   'bg-transparent border-[var(--color-primary)] text-[var(--color-primary)]',
        upcoming:  'bg-transparent border-[var(--color-border)] text-[var(--color-muted-foreground)]',
      },
    },
    defaultVariants: { status: 'upcoming' },
  },
);

// ---------------------------------------------------------------------------
// StepIndicator
// ---------------------------------------------------------------------------

export interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;    // 0-based index
  /** Orientation (default: horizontal) */
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

export function StepIndicator({
  steps,
  currentStep,
  orientation = 'horizontal',
  className,
  size = 'md',
}: StepIndicatorProps) {
  if (orientation === 'vertical') {
    return <VerticalStepIndicator steps={steps} currentStep={currentStep} className={className} size={size} />;
  }

  return (
    <nav
      aria-label="Progress"
      className={cn('flex items-center', className)}
    >
      {steps.map((step, idx) => {
        const status: StepStatus =
          idx < currentStep ? 'completed' : idx === currentStep ? 'current' : 'upcoming';
        const isLast = idx === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              {/* Circle */}
              <div
                className={cn(stepCircleVariants({ status }), size === 'sm' && 'h-6 w-6 text-[10px]')}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                {status === 'completed'
                  ? (step.icon ?? <CheckIcon size={size} />)
                  : idx + 1}
              </div>

              {/* Label */}
              <div className="text-center">
                <span
                  className={cn(
                    'block text-xs font-semibold',
                    status === 'current'   && 'text-[var(--color-primary)]',
                    status === 'completed' && 'text-[var(--color-foreground)]',
                    status === 'upcoming'  && 'text-[var(--color-muted-foreground)]',
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="block text-[0.65rem] text-[var(--color-muted-foreground)]">
                    {step.description}
                  </span>
                )}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className="flex-1 mx-2 mt-[-20px]"
                style={{ height: 2, flexShrink: 0 }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    background: idx < currentStep
                      ? 'var(--color-primary)'
                      : 'var(--color-border)',
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Vertical variant
// ---------------------------------------------------------------------------

function VerticalStepIndicator({
  steps,
  currentStep,
  className,
  size,
}: StepIndicatorProps) {
  return (
    <nav
      aria-label="Progress"
      className={cn('flex flex-col', className)}
    >
      {steps.map((step, idx) => {
        const status: StepStatus =
          idx < currentStep ? 'completed' : idx === currentStep ? 'current' : 'upcoming';
        const isLast = idx === steps.length - 1;

        return (
          <div key={step.id} className="flex gap-4">
            {/* Left column: circle + line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(stepCircleVariants({ status }), size === 'sm' && 'h-6 w-6 text-[10px]')}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                {status === 'completed'
                  ? (step.icon ?? <CheckIcon size={size} />)
                  : idx + 1}
              </div>
              {!isLast && (
                <div
                  className="flex-1 w-0.5 my-1 rounded-full transition-all duration-300"
                  style={{ minHeight: 24, background: idx < currentStep ? 'var(--color-primary)' : 'var(--color-border)' }}
                />
              )}
            </div>

            {/* Right column: content */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <span
                className={cn(
                  'block text-sm font-semibold leading-tight',
                  status === 'current'   && 'text-[var(--color-primary)]',
                  status === 'completed' && 'text-[var(--color-foreground)]',
                  status === 'upcoming'  && 'text-[var(--color-muted-foreground)]',
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
                  {step.description}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckIcon({ size }: { size?: string }) {
  const s = size === 'sm' ? 10 : 12;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
