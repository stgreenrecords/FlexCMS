export interface CtasHeroBannerData {
  eyebrow: string;
  headline: string;
  subheadline: string;
  /** Background image — 1920×820 */
  backgroundImage: string;
  primaryCta: { label: string; url: string };
  secondaryCta: { label: string; url: string };
}

export function CtasHeroBanner({ data }: { data: CtasHeroBannerData }) {
  return (
    <section className="relative min-h-[820px] flex items-center overflow-hidden bg-surface-container-highest">
      {data.backgroundImage && (
        <img
          src={data.backgroundImage}
          alt={data.headline}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      )}
      <div className="relative z-10 px-12 py-20 max-w-3xl">
        {data.eyebrow && (
          <span className="font-label text-xs font-bold text-primary uppercase tracking-[0.3em] mb-6 block">
            {data.eyebrow}
          </span>
        )}
        <h1 className="font-headline italic text-6xl md:text-8xl text-on-surface leading-none mb-8">
          {data.headline}
        </h1>
        {data.subheadline && (
          <p className="max-w-md font-body text-lg text-secondary mb-12 leading-relaxed">
            {data.subheadline}
          </p>
        )}
        <div className="flex gap-4 flex-wrap">
          {data.primaryCta?.label && (
            <a
              href={data.primaryCta.url}
              className="bg-primary text-on-primary px-10 py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all"
            >
              {data.primaryCta.label}
            </a>
          )}
          {data.secondaryCta?.label && (
            <a
              href={data.secondaryCta.url}
              className="border border-outline-variant px-10 py-4 font-label font-bold uppercase tracking-widest text-on-surface hover:bg-surface-variant transition-all"
            >
              {data.secondaryCta.label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
