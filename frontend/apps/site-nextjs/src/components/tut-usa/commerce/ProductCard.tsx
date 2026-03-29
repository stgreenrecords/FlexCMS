export interface ProductCardData {
  productName: string;
  /** Product image — 600×600 */
  image: string;
  price: number;
  shortDescription: string;
  cta: { label: string; url: string };
}

export function ProductCard({ data }: { data: ProductCardData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 flex flex-col">
      {data.image && (
        <div className="overflow-hidden aspect-square">
          <img
            src={data.image}
            alt={data.productName}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-headline italic text-xl text-on-surface mb-2">{data.productName}</h3>
        {data.shortDescription && (
          <p className="font-body text-sm text-secondary mb-4 flex-1">{data.shortDescription}</p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <span className="font-headline text-2xl text-primary">
            {typeof data.price === 'number' ? `$${data.price.toLocaleString()}` : data.price}
          </span>
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
    </div>
  );
}
