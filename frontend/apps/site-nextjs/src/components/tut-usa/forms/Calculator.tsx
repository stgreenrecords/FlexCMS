export interface CalculatorInput {
  label: string;
  name: string;
  min?: number;
  max?: number;
  defaultValue?: number;
  unit?: string;
}

export interface CalculatorData {
  title: string;
  inputs: CalculatorInput[];
  formula: string;
  resultLabel: string;
  disclaimer: string;
}

export function Calculator({ data }: { data: CalculatorData }) {
  return (
    <div className="bg-surface-container p-10 flex flex-col md:flex-row gap-12">
      <div className="md:w-1/2">
        <span className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-6 block">
          Financial Projection
        </span>
        <h3 className="font-headline text-2xl mb-8 leading-snug text-on-surface">{data.title}</h3>
        <div className="space-y-8">
          {data.inputs &&
            data.inputs.map((input, i) => (
              <div key={i}>
                <div className="flex justify-between mb-4">
                  <label className="font-label uppercase text-xs tracking-widest text-secondary">
                    {input.label}
                  </label>
                  {input.unit && (
                    <span className="font-label text-xs text-primary">{input.unit}</span>
                  )}
                </div>
                <input
                  type="range"
                  name={input.name}
                  min={input.min ?? 0}
                  max={input.max ?? 100}
                  defaultValue={input.defaultValue ?? 50}
                  className="w-full h-1 bg-outline-variant/30 appearance-none cursor-pointer accent-primary"
                />
              </div>
            ))}
        </div>
      </div>
      <div className="md:w-1/2 bg-surface-container-highest p-8 flex flex-col justify-center items-center text-center">
        <div className="font-label uppercase text-xs tracking-[0.3em] text-secondary mb-2">
          {data.resultLabel || 'Estimated Result'}
        </div>
        <div className="font-headline text-6xl italic text-on-surface mb-4">—</div>
        {data.disclaimer && (
          <p className="font-body text-xs text-secondary uppercase tracking-widest">
            {data.disclaimer}
          </p>
        )}
      </div>
    </div>
  );
}
