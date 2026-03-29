export interface MerchandiseCardData {
  productName: string;
  /** Product image — 600×600 */
  image: string;
  price: number;
  cta: { label: string; url: string };
  badge: string;
}

export function MerchandiseCard({ data }: { data: MerchandiseCardData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 relative">
      {data.badge && (
        <span className="absolute top-3 left-3 bg-primary text-on-primary px-3 py-1 font-label uppercase text-xs tracking-widest z-10">
          {data.badge}
        </span>
      )}
      {data.image && (
        <div className="aspect-square overflow-hidden">
          <img src={data.image} alt={data.productName} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6 flex items-center justify-between">
        <div>
          <span className="font-label text-xs uppercase tracking-widest text-on-surface block">{data.productName}</span>
          <span className="font-headline text-2xl text-primary">
            {typeof data.price === 'number' ? `$${data.price.toLocaleString()}` : data.price}
          </span>
        </div>
        {data.cta?.label && (
          <a
            href={data.cta.url}
            className="bg-primary text-on-primary px-6 py-2 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all"
          >
            {data.cta.label}
          </a>
        )}
      </div>
    </div>
  );
}
