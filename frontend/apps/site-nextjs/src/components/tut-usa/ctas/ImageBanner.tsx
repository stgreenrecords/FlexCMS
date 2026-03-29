export interface ImageBannerData {
  headline: string;
  /** Banner image — 1920×600 */
  image: string;
  overlayStyle: 'dark' | 'light' | 'none';
  cta: { label: string; url: string };
}

const overlayClasses: Record<string, string> = {
  dark: 'bg-gradient-to-t from-black/70 to-transparent',
  light: 'bg-gradient-to-t from-white/60 to-transparent',
  none: '',
};

export function ImageBanner({ data }: { data: ImageBannerData }) {
  return (
    <section className="relative min-h-[600px] flex items-end overflow-hidden bg-surface-container-highest">
      {data.image && (
        <img
          src={data.image}
          alt={data.headline}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div
        className={`absolute inset-0 ${overlayClasses[data.overlayStyle] ?? overlayClasses.dark}`}
      />
      <div className="relative z-10 px-12 pb-16">
        <h2 className="font-headline italic text-5xl text-on-surface mb-8">{data.headline}</h2>
        {data.cta?.label && (
          <a
            href={data.cta.url}
            className="inline-block bg-primary text-on-primary px-10 py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all"
          >
            {data.cta.label}
          </a>
        )}
      </div>
    </section>
  );
}
