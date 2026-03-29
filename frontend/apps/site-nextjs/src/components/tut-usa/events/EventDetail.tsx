export interface EventDetailData {
  eventName: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  registrationUrl: string;
}

export function EventDetail({ data }: { data: EventDetailData }) {
  return (
    <article className="bg-background py-12 px-8 max-w-3xl">
      <span className="font-label uppercase text-xs tracking-[0.3em] text-primary block mb-4">Event</span>
      <h1 className="font-headline italic text-4xl text-on-surface mb-6">{data.eventName}</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {data.startDate && (
          <div>
            <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">Start</span>
            <span className="font-body text-sm text-on-surface">{data.startDate}</span>
          </div>
        )}
        {data.endDate && (
          <div>
            <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">End</span>
            <span className="font-body text-sm text-on-surface">{data.endDate}</span>
          </div>
        )}
        {data.venue && (
          <div className="col-span-2">
            <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">Venue</span>
            <span className="font-body text-sm text-on-surface">{data.venue}</span>
          </div>
        )}
      </div>
      {data.description && (
        <p className="font-body text-sm text-secondary leading-relaxed mb-8">{data.description}</p>
      )}
      {data.registrationUrl && (
        <a
          href={data.registrationUrl}
          className="inline-block bg-primary text-on-primary px-10 py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Register
        </a>
      )}
    </article>
  );
}
