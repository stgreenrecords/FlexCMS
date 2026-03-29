export interface ItinerarySegment {
  time: string;
  activity: string;
  location?: string;
  notes?: string;
}

export interface ItineraryData {
  title: string;
  segments: ItinerarySegment[];
  travelerNames: string[];
  downloadPdf: boolean;
}

export function Itinerary({ data }: { data: ItineraryData }) {
  return (
    <section className="bg-surface-container p-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-headline italic text-3xl text-on-surface mb-2">{data.title}</h2>
          {data.travelerNames && data.travelerNames.length > 0 && (
            <p className="font-label text-xs uppercase tracking-widest text-secondary">
              {data.travelerNames.join(' · ')}
            </p>
          )}
        </div>
        {data.downloadPdf && (
          <button type="button" className="border border-outline-variant/40 text-secondary px-6 py-2 font-label uppercase text-xs tracking-widest hover:border-primary hover:text-on-surface transition-all">
            Download PDF
          </button>
        )}
      </div>
      {data.segments && data.segments.length > 0 && (
        <div className="space-y-0 border-l-2 border-outline-variant/30 pl-6">
          {data.segments.map((seg, i) => (
            <div key={i} className="relative pb-8">
              <div className="absolute -left-[1.625rem] top-0 w-3 h-3 bg-primary" />
              <span className="font-label uppercase text-xs tracking-widest text-primary block mb-1">{seg.time}</span>
              <span className="font-body text-sm text-on-surface block">{seg.activity}</span>
              {seg.location && <span className="font-label text-xs text-secondary block">{seg.location}</span>}
              {seg.notes && <span className="font-body text-xs text-secondary mt-1 block italic">{seg.notes}</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
