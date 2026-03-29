export interface WebinarSpeaker {
  name: string;
  title: string;
  photo?: string;
}

export interface WebinarPromoData {
  title: string;
  summary: string;
  dateTime: string;
  speakers: WebinarSpeaker[];
  registrationUrl: string;
}

export function WebinarPromo({ data }: { data: WebinarPromoData }) {
  return (
    <section className="bg-surface-container p-10">
      <span className="font-label uppercase text-xs tracking-[0.3em] text-primary block mb-4">Webinar</span>
      <h2 className="font-headline italic text-3xl text-on-surface mb-4">{data.title}</h2>
      {data.dateTime && (
        <p className="font-label uppercase text-xs tracking-widest text-secondary mb-6">{data.dateTime}</p>
      )}
      {data.summary && <p className="font-body text-sm text-secondary mb-8">{data.summary}</p>}
      {data.speakers && data.speakers.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-8">
          {data.speakers.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              {s.photo && <img src={s.photo} alt={s.name} className="w-10 h-10 rounded-full object-cover" />}
              <div>
                <span className="font-label text-xs uppercase tracking-widest text-on-surface block">{s.name}</span>
                {s.title && <span className="font-body text-xs text-secondary">{s.title}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {data.registrationUrl && (
        <a
          href={data.registrationUrl}
          className="inline-block bg-primary text-on-primary px-10 py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Register Now
        </a>
      )}
    </section>
  );
}
