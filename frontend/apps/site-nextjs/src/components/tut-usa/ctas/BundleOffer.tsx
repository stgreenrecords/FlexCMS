export interface BundleOfferData {
  title: string;
  includedItems: string[];
  bundlePrice: number;
  cta: { label: string; url: string };
}

export function BundleOffer({ data }: { data: BundleOfferData }) {
  return (
    <div className="bg-surface-container p-8 border border-outline-variant/20">
      <h3 className="font-headline italic text-3xl text-on-surface mb-6">{data.title}</h3>
      {data.includedItems && data.includedItems.length > 0 && (
        <ul className="space-y-3 mb-8">
          {data.includedItems.map((item, i) => (
            <li key={i} className="flex items-center gap-3 font-body text-sm text-secondary">
              <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      )}
      {data.bundlePrice != null && (
        <div className="mb-8">
          <span className="font-headline text-4xl text-on-surface">
            ${data.bundlePrice.toLocaleString()}
          </span>
          <span className="font-label text-xs text-secondary ml-2 uppercase tracking-widest">Bundle Price</span>
        </div>
      )}
      {data.cta?.label && (
        <a
          href={data.cta.url}
          className="block w-full bg-primary text-on-primary py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all text-center"
        >
          {data.cta.label}
        </a>
      )}
    </div>
  );
}
