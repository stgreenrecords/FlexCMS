export interface PreorderCtaData {
  title: string;
  description: string;
  releaseDate: string;
  cta: { label: string; url: string };
}

export function PreorderCta({ data }: { data: PreorderCtaData }) {
  return (
    <section className="bg-surface-container-low border border-outline-variant/30 p-10">
      <span className="font-label uppercase text-xs tracking-[0.3em] text-primary block mb-4">Coming Soon</span>
      <h2 className="font-headline italic text-3xl text-on-surface mb-4">{data.title}</h2>
      {data.description && <p className="font-body text-sm text-secondary mb-6">{data.description}</p>}
      {data.releaseDate && (
        <p className="font-label uppercase text-xs tracking-widest text-secondary mb-8">
          Available: {data.releaseDate}
        </p>
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
