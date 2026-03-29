export interface SplitHeroData {
  headline: string;
  body: string;
  /** Media image — 960×820 */
  media: string;
  primaryCta: { label: string; url: string };
  layout: 'image-right' | 'image-left';
}

export function SplitHero({ data }: { data: SplitHeroData }) {
  const imageLeft = data.layout === 'image-left';
  return (
    <section
      className={`grid grid-cols-1 lg:grid-cols-2 min-h-[820px] items-center ${imageLeft ? '' : ''}`}
    >
      <div className={`px-12 py-20 lg:py-0 ${imageLeft ? 'order-2' : 'order-1'}`}>
        <h1 className="font-headline italic text-6xl md:text-8xl text-on-surface leading-none mb-8">
          {data.headline}
        </h1>
        {data.body && (
          <p className="max-w-md font-body text-lg text-secondary mb-12 leading-relaxed">
            {data.body}
          </p>
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
      <div
        className={`relative h-full min-h-[500px] bg-surface-container-highest overflow-hidden ${imageLeft ? 'order-1' : 'order-2'}`}
      >
        {data.media && (
          <img
            src={data.media}
            alt={data.headline}
            className="w-full h-full object-cover"
          />
        )}
      </div>
    </section>
  );
}
