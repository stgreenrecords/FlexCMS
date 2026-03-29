export interface CrossSellProduct {
  productName: string;
  image: string;
  price: number;
  cta: { label: string; url: string };
}

export interface CrossSellData {
  title: string;
  products: CrossSellProduct[];
  selectionLogic: string;
}

export function CrossSell({ data }: { data: CrossSellData }) {
  return (
    <section className="bg-surface-container py-10 px-8">
      <h3 className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-6">{data.title}</h3>
      {data.products && data.products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.products.map((p, i) => (
            <div key={i} className="bg-surface-container-low border border-outline-variant/30 p-4">
              {p.image && <img src={p.image} alt={p.productName} className="w-full h-28 object-cover mb-3" />}
              <span className="font-label text-xs uppercase tracking-widest text-on-surface block mb-1">{p.productName}</span>
              <div className="flex items-center justify-between">
                <span className="font-headline text-base text-primary">
                  {typeof p.price === 'number' ? `$${p.price.toLocaleString()}` : p.price}
                </span>
                {p.cta?.label && (
                  <a href={p.cta.url} className="font-label text-xs text-primary hover:underline">{p.cta.label}</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
