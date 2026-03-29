export interface NumberedStepsData {
  title: string;
  steps: { title: string; description: string }[];
  orientation: 'vertical' | 'horizontal';
}

interface Props {
  data: NumberedStepsData;
}

export function NumberedSteps({ data }: Props) {
  const { title, steps, orientation } = data;

  return (
    <section className="py-6">
      {title && (
        <h3 className="font-headline italic text-on-surface text-2xl mb-6">{title}</h3>
      )}
      <ol
        className={`flex ${
          orientation === 'horizontal' ? 'flex-row gap-6 overflow-x-auto' : 'flex-col gap-6'
        }`}
      >
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4 items-start flex-1 min-w-[180px]">
            <span className="shrink-0 w-8 h-8 rounded-full border border-primary text-primary font-label text-sm flex items-center justify-center font-bold">
              {i + 1}
            </span>
            <div className="flex flex-col gap-1">
              <h4 className="font-label tracking-widest uppercase text-xs text-on-surface">
                {step.title}
              </h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
