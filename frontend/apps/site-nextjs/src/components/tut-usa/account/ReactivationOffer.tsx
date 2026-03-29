export interface ReactivationOfferData {
  title: string;
  description: string;
  offerDetails: string;
  cta: { label: string; url: string };
}

export function ReactivationOffer({ data }: { data: ReactivationOfferData }) {
  return (
    <section className="bg-surface-container-low border border-primary/30 p-10">
      <span className="font-label uppercase text-xs tracking-[0.3em] text-primary block mb-4">Special Offer</span>
      <h2 className="font-headline italic text-3xl text-on-surface mb-4">{data.title}</h2>
      {data.description && <p className="font-body text-sm text-secondary mb-4">{data.description}</p>}
      {data.offerDetails && (
        <p className="font-label text-xs uppercase tracking-widest text-primary mb-8">{data.offerDetails}</p>
      )}
      {data.cta?.label && (
        <a
          href={data.cta.url}
          className="inline-block bg-primary text-on-primary px-10 py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          {data.cta.label}
        </a>
      )}
    </section>
  );
}
