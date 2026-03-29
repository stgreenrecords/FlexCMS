export interface VideoHeroData {
  headline: string;
  body: string;
  /** Video asset */
  video: string;
  /** Poster image — 1280×720 */
  posterImage: string;
  primaryCta: { label: string; url: string };
}

export function VideoHero({ data }: { data: VideoHeroData }) {
  return (
    <section className="relative min-h-[720px] flex items-center justify-center text-center overflow-hidden bg-surface-container-highest">
      {data.video && (
        <video
          src={data.video}
          poster={data.posterImage}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      )}
      <div className="relative z-10 max-w-3xl px-12 py-20">
        <h1 className="font-headline italic text-6xl md:text-8xl text-on-surface leading-none mb-8">
          {data.headline}
        </h1>
        {data.body && (
          <p className="font-body text-lg text-secondary mb-12 leading-relaxed">{data.body}</p>
        )}
        {data.primaryCta?.label && (
          <a
            href={data.primaryCta.url}
            className="inline-block bg-primary text-on-primary px-10 py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all"
          >
            {data.primaryCta.label}
          </a>
        )}
      </div>
    </section>
  );
}
