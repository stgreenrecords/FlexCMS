export interface EventCardAltItem {
  title: string;
  date?: string;
  url: string;
}

export interface EventCardAltData {
  title: string;
  description: string;
  items: EventCardAltItem[];
  layout: string;
  cta: { label: string; url: string };
}

export function EventCardAlt({ data }: { data: EventCardAltData }) {
  const isGrid = data.layout === 'grid';
  return (
    <section className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-4">{data.title}</h2>
      {data.description && <p className="font-body text-sm text-secondary mb-8">{data.description}</p>}
      {data.items && data.items.length > 0 && (
        <div className={isGrid ? 'grid grid-cols-2 md:grid-cols-3 gap-4 mb-8' : 'space-y-3 mb-8'}>
          {data.items.map((item, i) => (
            <a key={i} href={item.url} className="bg-surface-container-low border border-outline-variant/30 p-4 hover:border-primary transition-all block">
              {item.date && <span className="font-label uppercase text-xs tracking-widest text-primary block mb-1">{item.date}</span>}
              <span className="font-body text-sm text-on-surface">{item.title}</span>
            </a>
          ))}
        </div>
      )}
      {data.cta?.label && (
        <a href={data.cta.url} className="font-label uppercase text-xs tracking-widest text-primary hover:underline">
          {data.cta.label} →
        </a>
      )}
    </section>
  );
}
