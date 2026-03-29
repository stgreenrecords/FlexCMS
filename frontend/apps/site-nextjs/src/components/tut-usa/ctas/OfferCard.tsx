export interface OfferCardData {
  title: string;
  description: string;
  offerCode: string;
  expiryDate: string;
  cta: { label: string; url: string };
}

export function OfferCard({ data }: { data: OfferCardData }) {
  return (
    <div className="border border-outline-variant/30 p-8 flex flex-col gap-4 bg-surface-container">
      <h3 className="font-headline italic text-2xl text-on-surface">{data.title}</h3>
      {data.description && (
        <p className="font-body text-sm text-secondary">{data.description}</p>
      )}
      {data.offerCode && (
        <div className="border border-dashed border-outline-variant px-4 py-2 font-label text-sm font-bold tracking-widest text-primary uppercase self-start">
          {data.offerCode}
        </div>
      )}
      {data.expiryDate && (
        <p className="font-label text-xs text-secondary uppercase tracking-widest">
          Expires: {new Date(data.expiryDate).toLocaleDateString()}
        </p>
      )}
      {data.cta?.label && (
        <a
          href={data.cta.url}
          className="mt-2 bg-primary text-on-primary px-6 py-3 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all text-center"
        >
          {data.cta.label}
        </a>
      )}
    </div>
  );
}
