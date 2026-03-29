export interface ProductGridItem {
  productName: string;
  image: string;
  price: number;
  cta: { label: string; url: string };
}

export interface ProductGridData {
  title: string;
  products: ProductGridItem[];
  columns: number;
  enableSorting: boolean;
}

export function ProductGrid({ data }: { data: ProductGridData }) {
  const cols = data.columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : data.columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2';
  return (
    <section className="bg-background py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-headline italic text-3xl text-on-surface">{data.title}</h2>
        {data.enableSorting && (
          <select className="bg-transparent border border-outline-variant/40 py-2 px-4 font-label text-xs uppercase tracking-widest text-secondary focus:outline-none">
            <option>Sort by</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        )}
      </div>
      {data.products && data.products.length > 0 && (
        <div className={`grid ${cols} gap-6`}>
          {data.products.map((p, i) => (
            <div key={i} className="bg-surface-container border border-outline-variant/30 flex flex-col">
              {p.image && (
                <div className="aspect-square overflow-hidden">
                  <img src={p.image} alt={p.productName} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-label text-xs uppercase tracking-widest text-on-surface block">{p.productName}</span>
                  <span className="font-headline text-xl text-primary">
                    {typeof p.price === 'number' ? `$${p.price.toLocaleString()}` : p.price}
                  </span>
                </div>
                {p.cta?.label && (
                  <a href={p.cta.url} className="bg-primary text-on-primary px-4 py-2 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all">
                    {p.cta.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
