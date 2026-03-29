export interface PromoBannerData {
  title: string;
  description: string;
  /** Promo image — 1200×400 */
  image: string;
  cta: { label: string; url: string };
  theme: 'default' | 'error' | 'accent';
}

const themeStyles: Record<string, string> = {
  default: 'bg-surface-container text-on-surface',
  error: 'bg-error-container text-on-error-container',
  accent: 'bg-surface-container-high text-on-surface',
};

export function PromoBanner({ data }: { data: PromoBannerData }) {
  const style = themeStyles[data.theme] ?? themeStyles.default;
  return (
    <section className={`mx-12 my-20 ${style} p-8 flex flex-col md:flex-row justify-between items-center gap-6`}>
      <div className="flex items-center gap-6">
        {data.image && (
          <img src={data.image} alt={data.title} className="w-16 h-16 object-cover shrink-0" />
        )}
        <div>
          <h3 className="font-headline italic text-2xl mb-1">{data.title}</h3>
          <p className="font-body text-sm opacity-80">{data.description}</p>
        </div>
      </div>
      {data.cta?.label && (
        <a
          href={data.cta.url}
          className="shrink-0 border border-current px-8 py-3 font-label font-bold uppercase tracking-widest hover:bg-surface-container transition-all"
        >
          {data.cta.label}
        </a>
      )}
    </section>
  );
}
