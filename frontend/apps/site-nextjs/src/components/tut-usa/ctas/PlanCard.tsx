export interface PlanCardData {
  planName: string;
  price: string;
  features: string[];
  cta: { label: string; url: string };
  badge: string;
}

export function PlanCard({ data }: { data: PlanCardData }) {
  return (
    <div className="border border-outline-variant/20 p-12 flex flex-col items-center text-center relative">
      {data.badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-6 py-1 text-xs font-bold uppercase tracking-[0.2em]">
          {data.badge}
        </div>
      )}
      <span className="font-label text-xs tracking-[0.2em] text-secondary uppercase mb-8 mt-4">
        {data.planName}
      </span>
      <div className="mb-12">
        <span className="font-headline text-5xl text-on-surface">{data.price}</span>
      </div>
      {data.features && data.features.length > 0 && (
        <ul className="space-y-4 mb-16 font-body text-sm text-secondary w-full">
          {data.features.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}
      {data.cta?.label && (
        <a
          href={data.cta.url}
          className="w-full border border-outline-variant py-4 font-label font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container transition-all text-center block"
        >
          {data.cta.label}
        </a>
      )}
    </div>
  );
}
