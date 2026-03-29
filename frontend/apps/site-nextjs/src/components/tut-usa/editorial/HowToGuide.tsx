export interface HowToGuideData {
  title: string;
  introduction: string;
  steps: { title: string; instructions: string }[];
  estimatedTime: number;
}

interface Props {
  data: HowToGuideData;
}

export function HowToGuide({ data }: Props) {
  const { title, introduction, steps, estimatedTime } = data;

  return (
    <article className="py-8">
      <header className="mb-8">
        <h1 className="font-headline italic text-on-surface text-4xl mb-4">{title}</h1>
        <div className="flex items-center gap-4 text-xs font-label tracking-widest uppercase text-on-surface-variant mb-4">
          {estimatedTime > 0 && (
            <span>Est. {estimatedTime} min</span>
          )}
        </div>
        {introduction && (
          <p className="text-on-surface-variant leading-relaxed">{introduction}</p>
        )}
      </header>
      <ol className="flex flex-col gap-8">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-5">
            <div className="shrink-0 flex flex-col items-center">
              <span className="w-8 h-8 rounded-full bg-primary text-surface font-bold text-sm flex items-center justify-center">
                {i + 1}
              </span>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-outline-variant/30 mt-2" />
              )}
            </div>
            <div className="pb-4">
              <h3 className="font-headline italic text-on-surface text-lg mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                {step.instructions}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
