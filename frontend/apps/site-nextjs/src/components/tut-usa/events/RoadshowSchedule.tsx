export interface RoadshowStop {
  city: string;
  date: string;
  venue?: string;
  registrationUrl?: string;
}

export interface RoadshowScheduleData {
  title: string;
  stops: RoadshowStop[];
  registerUrl: string;
}

export function RoadshowSchedule({ data }: { data: RoadshowScheduleData }) {
  return (
    <section className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      {data.stops && data.stops.length > 0 && (
        <div className="space-y-0">
          {data.stops.map((stop, i) => (
            <div key={i} className="flex items-center gap-6 border-b border-outline-variant/20 py-4">
              <span className="font-label uppercase text-xs tracking-widest text-primary w-24 flex-shrink-0">{stop.date}</span>
              <span className="font-headline italic text-xl text-on-surface flex-1">{stop.city}</span>
              {stop.venue && <span className="font-label text-xs text-secondary uppercase tracking-widest hidden md:block">{stop.venue}</span>}
              {(stop.registrationUrl || data.registerUrl) && (
                <a href={stop.registrationUrl || data.registerUrl} className="font-label uppercase text-xs tracking-widest text-primary hover:underline flex-shrink-0">
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
