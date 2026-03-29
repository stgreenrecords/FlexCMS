export interface EventListItem {
  eventName: string;
  startDate: string;
  location: string;
  url: string;
}

export interface EventListData {
  title: string;
  events: EventListItem[];
  showFilters: boolean;
  layout: string;
}

export function EventList({ data }: { data: EventListData }) {
  const isGrid = data.layout === 'grid';
  return (
    <section className="bg-background py-12 px-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-headline italic text-3xl text-on-surface">{data.title}</h2>
        {data.showFilters && (
          <select className="bg-transparent border border-outline-variant/40 py-2 px-4 font-label text-xs uppercase tracking-widest text-secondary focus:outline-none">
            <option>All Events</option>
            <option>Upcoming</option>
            <option>Past</option>
          </select>
        )}
      </div>
      {data.events && data.events.length > 0 && (
        <div className={isGrid ? 'grid grid-cols-1 md:grid-cols-3 gap-6' : 'space-y-4'}>
          {data.events.map((ev, i) => (
            <a key={i} href={ev.url} className="bg-surface-container border border-outline-variant/30 p-6 hover:border-primary transition-all block">
              {ev.startDate && (
                <span className="font-label uppercase text-xs tracking-widest text-primary block mb-1">{ev.startDate}</span>
              )}
              <span className="font-headline italic text-xl text-on-surface block mb-1">{ev.eventName}</span>
              {ev.location && (
                <span className="font-label text-xs text-secondary uppercase tracking-widest">{ev.location}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
