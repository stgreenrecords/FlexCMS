export interface GiftGuideData {
  title: string;
  description: string;
  products: string[];
  audience: string;
}

export function GiftGuide({ data }: { data: GiftGuideData }) {
  return (
    <section className="px-12 py-20">
      <div className="mb-12">
        {data.audience && (
          <span className="font-label text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 block">
            For: {data.audience}
          </span>
        )}
        <h2 className="font-headline italic text-4xl text-on-surface mb-4">{data.title}</h2>
        {data.description && (
          <p className="font-body text-secondary max-w-2xl">{data.description}</p>
        )}
      </div>
      {data.products && data.products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.products.map((ref, i) => (
            <div key={i} className="bg-surface-container-low h-48 flex items-center justify-center">
              <span className="font-body text-xs text-secondary">{ref}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
