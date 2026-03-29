export interface PromoTileData {
  title: string;
  description: string;
  /** Promo tile image — 400×300 */
  image: string;
  cta: { label: string; url: string };
}

export function PromoTile({ data }: { data: PromoTileData }) {
  return (
    <div className="bg-surface-container-low flex flex-col overflow-hidden">
      {data.image && (
        <img src={data.image} alt={data.title} className="w-full h-48 object-cover" />
      )}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-headline italic text-2xl text-on-surface mb-3">{data.title}</h3>
        {data.description && (
          <p className="font-body text-sm text-secondary mb-6 flex-1">{data.description}</p>
        )}
        {data.cta?.label && (
          <a
            href={data.cta.url}
            className="font-label text-xs font-bold uppercase border-b border-primary text-primary hover:text-on-surface transition-colors self-start"
          >
            {data.cta.label}
          </a>
        )}
      </div>
    </div>
  );
}
