export interface OfferCardAltData {
  title: string;
  description: string;
  items: string[];
  layout: 'grid' | 'list';
  cta: { label: string; url: string };
}

export function OfferCardAlt({ data }: { data: OfferCardAltData }) {
  return (
    <div className="bg-surface-container-high border border-primary/20 p-8 flex flex-col gap-6">
      <h3 className="font-headline italic text-2xl text-on-surface">{data.title}</h3>
      {data.description && (
        <p className="font-body text-sm text-secondary">{data.description}</p>
      )}
      {data.items && data.items.length > 0 && (
        <div className={data.layout === 'list' ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-3'}>
          {data.items.map((ref, i) => (
            <div key={i} className="bg-surface-container p-4 text-xs font-body text-secondary">
              {ref}
            </div>
          ))}
        </div>
      )}
      {data.cta?.label && (
        <a
          href={data.cta.url}
          className="bg-primary text-on-primary py-3 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all text-center"
        >
          {data.cta.label}
        </a>
      )}
    </div>
  );
}
