export interface UpsellProduct {
  productName: string;
  image: string;
  price: number;
  cta: { label: string; url: string };
}

export interface UpsellRecommendationData {
  title: string;
  products: UpsellProduct[];
  placement: string;
}

export function UpsellRecommendation({ data }: { data: UpsellRecommendationData }) {
  return (
    <section className="bg-surface-container-low py-10 px-8">
      <h3 className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-6">{data.title}</h3>
      {data.products && data.products.length > 0 && (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {data.products.map((p, i) => (
            <div key={i} className="bg-surface-container border border-outline-variant/30 p-4 flex-shrink-0 w-48">
              {p.image && <img src={p.image} alt={p.productName} className="w-full h-32 object-cover mb-3" />}
              <span className="font-label text-xs uppercase tracking-widest text-on-surface block mb-1">{p.productName}</span>
              <span className="font-headline text-lg text-primary block mb-3">
                {typeof p.price === 'number' ? `$${p.price.toLocaleString()}` : p.price}
              </span>
              {p.cta?.label && (
                <a href={p.cta.url} className="block text-center bg-primary text-on-primary py-2 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all">
                  {p.cta.label}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
