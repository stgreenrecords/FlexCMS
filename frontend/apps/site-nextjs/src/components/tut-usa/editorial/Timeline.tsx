export interface TimelineData {
  title: string;
  events: { date: string; title: string; description: string }[];
  layout: 'vertical' | 'horizontal';
}

interface Props {
  data: TimelineData;
}

export function Timeline({ data }: Props) {
  const { title, events, layout } = data;

  return (
    <section className="py-6">
      {title && (
        <h3 className="font-headline italic text-on-surface text-2xl mb-8">{title}</h3>
      )}
      {layout === 'vertical' ? (
        <div className="relative pl-8 border-l border-outline-variant/30 flex flex-col gap-8">
          {events.map((event, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[2.25rem] top-1 w-3 h-3 rounded-full bg-primary border-2 border-surface" />
              <span className="font-label tracking-widest uppercase text-xs text-primary mb-1 block">
                {event.date}
              </span>
              <h4 className="font-headline italic text-on-surface text-base mb-1">
                {event.title}
              </h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {event.description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          <div className="flex gap-0 items-start">
            {events.map((event, i) => (
              <div key={i} className="flex-1 min-w-[160px] relative pt-6">
                <div className="absolute top-2 left-0 right-0 h-px bg-outline-variant/30" />
                <span className="absolute top-0 left-4 w-3 h-3 rounded-full bg-primary border-2 border-surface" />
                <div className="pl-4 pr-2">
                  <span className="font-label tracking-widest uppercase text-xs text-primary mb-1 block">
                    {event.date}
                  </span>
                  <h4 className="font-headline italic text-on-surface text-sm mb-1">
                    {event.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {event.description}
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
