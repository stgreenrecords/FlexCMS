export interface MarketplaceListingCardData {
  title: string;
  summary: string;
  /** Integration logo — 120×40 */
  logo: string;
  rating: number;
  cta: { label: string; url: string };
}

export function MarketplaceListingCard({ data }: { data: MarketplaceListingCardData }) {
  const stars = Math.round(Math.min(5, Math.max(0, data.rating)));
  return (
    <div className="border border-outline-variant/30 bg-surface-container p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {data.logo ? (
          <img src={data.logo} alt={data.title} className="h-10 w-auto object-contain" />
        ) : (
          <div className="w-24 h-10 bg-surface-variant flex items-center justify-center font-label text-xs text-secondary">
            Logo
          </div>
        )}
      </div>
      <h3 className="font-headline italic text-xl text-on-surface">{data.title}</h3>
      {data.summary && <p className="font-body text-sm text-secondary">{data.summary}</p>}
      {data.rating != null && (
        <div className="flex items-center gap-2">
          <span className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < stars ? 'text-primary' : 'text-secondary'}>
                ★
              </span>
            ))}
          </span>
          <span className="font-label text-xs text-secondary">{data.rating.toFixed(1)}</span>
        </div>
      )}
      {data.cta?.label && (
        <a
          href={data.cta.url}
          className="mt-auto border border-outline-variant py-3 font-label font-bold uppercase tracking-widest text-on-surface hover:bg-surface-variant transition-all text-center text-xs"
        >
          {data.cta.label}
        </a>
      )}
    </div>
  );
}
