export interface CheckoutProgressData {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
}

export function CheckoutProgress({ data }: { data: CheckoutProgressData }) {
  return (
    <nav className="bg-surface-container-low py-6 px-8">
      <ol className="flex items-center justify-between">
        {data.steps && data.steps.map((step, i) => {
          const stepNum = i + 1;
          const isComplete = data.completedSteps?.includes(stepNum);
          const isCurrent = stepNum === data.currentStep;
          return (
            <li key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center font-label text-xs font-bold ${
                    isComplete
                      ? 'bg-primary text-on-primary'
                      : isCurrent
                      ? 'border-2 border-primary text-primary'
                      : 'border border-outline-variant/40 text-secondary'
                  }`}
                >
                  {isComplete ? '✓' : stepNum}
                </div>
                <span
                  className={`font-label uppercase text-xs tracking-widest mt-2 ${
                    isCurrent ? 'text-on-surface' : 'text-secondary'
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < data.steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${isComplete ? 'bg-primary' : 'bg-outline-variant/30'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
