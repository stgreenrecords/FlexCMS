export interface AgendaItem {
  time: string;
  title: string;
  speaker?: string;
  location?: string;
}

export interface AgendaData {
  title: string;
  items: AgendaItem[];
  timeZone: string;
}

export function Agenda({ data }: { data: AgendaData }) {
  return (
    <section className="bg-surface-container p-10">
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="font-headline italic text-3xl text-on-surface">{data.title}</h2>
        {data.timeZone && (
          <span className="font-label uppercase text-xs tracking-widest text-secondary">{data.timeZone}</span>
        )}
      </div>
      {data.items && data.items.length > 0 && (
        <div className="space-y-0">
          {data.items.map((item, i) => (
            <div key={i} className="flex gap-6 border-b border-outline-variant/20 py-4">
              <span className="font-label uppercase text-xs tracking-widest text-primary w-20 flex-shrink-0">{item.time}</span>
              <div className="flex-1">
                <span className="font-body text-sm text-on-surface block">{item.title}</span>
                {item.speaker && <span className="font-label text-xs text-secondary">{item.speaker}</span>}
              </div>
              {item.location && (
                <span className="font-label text-xs text-secondary uppercase tracking-widest">{item.location}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
