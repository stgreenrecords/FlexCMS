export interface DemoRequestCtaData {
  title: string;
  description: string;
  cta: { label: string; url: string };
  supportingPoints: string[];
}

export function DemoRequestCta({ data }: { data: DemoRequestCtaData }) {
  return (
    <section className="px-12 py-20 bg-surface-container">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="font-headline italic text-4xl text-on-surface mb-6">{data.title}</h2>
          {data.description && (
            <p className="font-body text-secondary mb-8">{data.description}</p>
          )}
          {data.cta?.label && (
            <a
              href={data.cta.url}
              className="inline-block bg-primary text-on-primary px-10 py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all"
            >
              {data.cta.label}
            </a>
          )}
        </div>
        {data.supportingPoints && data.supportingPoints.length > 0 && (
          <ul className="space-y-4">
            {data.supportingPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-4 font-body text-sm text-secondary">
                <span className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
