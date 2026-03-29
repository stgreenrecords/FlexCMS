export interface MilestoneTimelineData {
  title: string;
  milestones: { date: string; title: string; description: string; completed: boolean }[];
  layout: 'vertical' | 'horizontal';
}

interface Props {
  data: MilestoneTimelineData;
}

export function MilestoneTimeline({ data }: Props) {
  const { title, milestones, layout } = data;

  return (
    <section className="py-8">
      {title && (
        <h2 className="font-headline italic text-on-surface text-3xl mb-8">{title}</h2>
      )}
      {layout === 'vertical' ? (
        <div className="relative pl-8 border-l border-outline-variant/30 flex flex-col gap-8">
          {milestones.map((m, i) => (
            <div key={i} className="relative">
              <span
                className={`absolute -left-[2.25rem] top-1 w-4 h-4 rounded-full border-2 border-surface ${
                  m.completed ? 'bg-primary' : 'bg-on-surface-variant/30'
                }`}
              />
              <span className="font-label tracking-widest uppercase text-xs text-primary mb-1 block">
                {m.date}
              </span>
              <h3
                className={`font-headline italic text-base mb-1 ${
                  m.completed ? 'text-on-surface' : 'text-on-surface-variant'
                }`}
              >
                {m.title}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{m.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          <div className="flex items-start">
            {milestones.map((m, i) => (
              <div key={i} className="flex-1 min-w-[160px] relative pt-6">
                <div className="absolute top-2 left-0 right-0 h-px bg-outline-variant/30" />
                <span
                  className={`absolute top-0 left-4 w-4 h-4 rounded-full border-2 border-surface ${
                    m.completed ? 'bg-primary' : 'bg-on-surface-variant/30'
                  }`}
                />
                <div className="pl-4 pr-2">
                  <span className="font-label tracking-widest uppercase text-xs text-primary mb-1 block">
                    {m.date}
                  </span>
                  <h3
                    className={`font-headline italic text-sm mb-1 ${
                      m.completed ? 'text-on-surface' : 'text-on-surface-variant'
                    }`}
                  >
                    {m.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {m.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
