export interface CollectionSpotlightData {
  title: string;
  description: string;
  items: string[];
  cta: { label: string; url: string };
}

export function CollectionSpotlight({ data }: { data: CollectionSpotlightData }) {
  return (
    <section className="px-12 py-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h2 className="font-headline italic text-4xl text-on-surface mb-3">{data.title}</h2>
          {data.description && (
            <p className="font-body text-secondary max-w-xl">{data.description}</p>
          )}
        </div>
        {data.cta?.label && (
          <a
            href={data.cta.url}
            className="shrink-0 font-label text-xs font-bold uppercase border-b border-primary text-primary hover:text-on-surface transition-colors"
          >
            {data.cta.label}
          </a>
        )}
      </div>
      {data.items && data.items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.items.map((ref, i) => (
            <div key={i} className="bg-surface-container-low h-48 flex items-center justify-center">
              <span className="font-body text-xs text-secondary">{ref}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
