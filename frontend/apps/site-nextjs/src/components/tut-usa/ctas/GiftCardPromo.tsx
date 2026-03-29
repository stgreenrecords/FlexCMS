export interface GiftCardPromoData {
  title: string;
  description: string;
  amountOptions: number[];
  cta: { label: string; url: string };
}

export function GiftCardPromo({ data }: { data: GiftCardPromoData }) {
  return (
    <section className="px-12 py-20 bg-surface-container text-center">
      <h2 className="font-headline italic text-4xl text-on-surface mb-6">{data.title}</h2>
      {data.description && (
        <p className="font-body text-secondary max-w-xl mx-auto mb-10">{data.description}</p>
      )}
      {data.amountOptions && data.amountOptions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {data.amountOptions.map((amount, i) => (
            <div
              key={i}
              className="border border-outline-variant/40 px-8 py-4 font-headline text-2xl text-on-surface hover:border-primary hover:text-primary transition-all cursor-pointer"
            >
              ${amount.toLocaleString()}
            </div>
          ))}
        </div>
      )}
      {data.cta?.label && (
        <a
          href={data.cta.url}
          className="inline-block bg-primary text-on-primary px-10 py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all"
        >
          {data.cta.label}
        </a>
      )}
    </section>
  );
}
