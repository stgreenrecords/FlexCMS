export interface WebinarReplayData {
  title: string;
  summary: string;
  videoUrl: string;
  /** Slides asset URL */
  slidesFile: string;
  cta: { label: string; url: string };
}

export function WebinarReplay({ data }: { data: WebinarReplayData }) {
  return (
    <section className="bg-surface-container p-10">
      <span className="font-label uppercase text-xs tracking-[0.3em] text-primary block mb-4">On Demand</span>
      <h2 className="font-headline italic text-3xl text-on-surface mb-4">{data.title}</h2>
      {data.summary && <p className="font-body text-sm text-secondary mb-6">{data.summary}</p>}
      {data.videoUrl && (
        <div className="bg-surface-container-low aspect-video mb-6 flex items-center justify-center">
          <span className="font-label uppercase text-xs tracking-widest text-secondary">Video Player</span>
        </div>
      )}
      <div className="flex gap-4">
        {data.cta?.label && (
          <a href={data.cta.url} className="bg-primary text-on-primary px-8 py-3 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all">
            {data.cta.label}
          </a>
        )}
        {data.slidesFile && (
          <a href={data.slidesFile} download className="border border-outline-variant/40 text-secondary px-8 py-3 font-label uppercase text-xs tracking-widest hover:border-primary hover:text-on-surface transition-all">
            Download Slides
          </a>
        )}
      </div>
    </section>
  );
}
