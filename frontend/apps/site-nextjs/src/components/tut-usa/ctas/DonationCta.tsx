export interface DonationCtaData {
  title: string;
  description: string;
  donationUrl: string;
  suggestedAmounts: number[];
}

export function DonationCta({ data }: { data: DonationCtaData }) {
  return (
    <section className="px-12 py-20 bg-surface-container text-center">
      <h2 className="font-headline italic text-4xl text-on-surface mb-6">{data.title}</h2>
      {data.description && (
        <p className="font-body text-secondary max-w-xl mx-auto mb-10">{data.description}</p>
      )}
      {data.suggestedAmounts && data.suggestedAmounts.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {data.suggestedAmounts.map((amount, i) => (
            <a
              key={i}
              href={data.donationUrl}
              className="border border-outline-variant px-8 py-3 font-label font-bold uppercase tracking-widest text-on-surface hover:bg-primary hover:text-on-primary hover:border-primary transition-all"
            >
              ${amount}
            </a>
          ))}
        </div>
      )}
      {data.donationUrl && (
        <a
          href={data.donationUrl}
          className="inline-block bg-primary text-on-primary px-10 py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all"
        >
          Donate Now
        </a>
      )}
    </section>
  );
}
