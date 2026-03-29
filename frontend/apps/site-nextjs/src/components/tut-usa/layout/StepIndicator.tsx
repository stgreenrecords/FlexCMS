import React from 'react';

export interface StepIndicatorData {
  steps: string[];
  currentStep: number;
  orientation: 'horizontal' | 'vertical';
}

interface StepIndicatorProps {
  data: StepIndicatorData;
}

export function StepIndicator({ data }: StepIndicatorProps) {
  const { steps, currentStep, orientation } = data;

  const isHorizontal = orientation === 'horizontal';

  return (
    <nav
      aria-label="Progress steps"
      className={`flex ${isHorizontal ? 'flex-row items-center' : 'flex-col'} gap-0`}
    >
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <div
              className={`flex ${isHorizontal ? 'flex-col items-center' : 'flex-row items-center'} gap-2`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div
                className="flex items-center justify-center flex-shrink-0 font-label text-xs"
                style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: isActive || isCompleted
                    ? 'var(--color-primary, #c6c6c7)'
                    : 'transparent',
                  color: isActive || isCompleted
                    ? 'var(--color-on-primary, #070d1f)'
                    : 'var(--color-primary, #c6c6c7)',
                  border: '1px solid',
                  borderColor: isActive || isCompleted
                    ? 'var(--color-primary, #c6c6c7)'
                    : 'var(--color-outline-variant, #32457c)',
                }}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span
                className="font-label text-xs tracking-widest uppercase"
                style={{
                  color: isActive
                    ? 'var(--color-on-surface, #dfe4ff)'
                    : isCompleted
                    ? 'var(--color-primary, #c6c6c7)'
                    : 'var(--color-outline-variant, #32457c)',
                  whiteSpace: isHorizontal ? 'nowrap' : undefined,
                }}
              >
                {step}
              </span>
            </div>

            {!isLast && (
              <div
                aria-hidden="true"
                style={{
                  ...(isHorizontal
                    ? {
                        flex: 1,
                        height: '1px',
                        minWidth: '2rem',
                        alignSelf: 'flex-start',
                        marginTop: '1rem',
                      }
                    : {
                        width: '1px',
                        height: '1.5rem',
                        marginLeft: '1rem',
                      }),
                  backgroundColor: isCompleted
                    ? 'var(--color-primary, #c6c6c7)'
                    : 'var(--color-outline-variant, #32457c)',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
