export interface TrainingSession {
  title: string;
  dateTime: string;
  format: string;
  instructor?: string;
}

export interface TrainingScheduleData {
  title: string;
  sessions: TrainingSession[];
  timeZone: string;
  registerUrl: string;
}

export function TrainingSchedule({ data }: { data: TrainingScheduleData }) {
  return (
    <section className="bg-background py-12 px-8">
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="font-headline italic text-3xl text-on-surface">{data.title}</h2>
        {data.timeZone && (
          <span className="font-label uppercase text-xs tracking-widest text-secondary">{data.timeZone}</span>
        )}
      </div>
      {data.sessions && data.sessions.length > 0 && (
        <div className="space-y-4">
          {data.sessions.map((s, i) => (
            <div key={i} className="bg-surface-container border border-outline-variant/30 p-6 flex items-center gap-6">
              <div className="flex-1">
                <h3 className="font-label text-xs uppercase tracking-widest text-on-surface mb-1">{s.title}</h3>
                <p className="font-label text-xs text-secondary">{s.dateTime}</p>
                {s.instructor && <p className="font-label text-xs text-secondary">{s.instructor}</p>}
              </div>
              {s.format && (
                <span className="font-label uppercase text-xs tracking-widest text-primary border border-primary px-3 py-1">{s.format}</span>
              )}
              {data.registerUrl && (
                <a href={data.registerUrl} className="font-label uppercase text-xs tracking-widest text-primary hover:underline flex-shrink-0">
                  Register →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
