export interface ConfiguratorStep {
  title: string;
  options: { label: string; value: string; price?: number }[];
}

export interface ConfiguratorData {
  title: string;
  steps: ConfiguratorStep[];
  pricingLogic: string;
  completionCta: { label: string; url: string };
}

export function Configurator({ data }: { data: ConfiguratorData }) {
  return (
    <section className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-10">{data.title}</h2>
      {data.steps && data.steps.length > 0 && (
        <div className="space-y-10">
          {data.steps.map((step, i) => (
            <div key={i}>
              <h3 className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-4">
                Step {i + 1} — {step.title}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {step.options?.map((opt, j) => (
                  <button
                    key={j}
                    type="button"
                    className="border border-outline-variant/40 p-4 text-left hover:border-primary transition-all group"
                  >
                    <span className="font-label text-xs uppercase tracking-widest text-on-surface block">{opt.label}</span>
                    {opt.price !== undefined && (
                      <span className="font-body text-xs text-secondary mt-1 block">+${opt.price.toLocaleString()}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {data.completionCta?.label && (
        <div className="mt-10 flex justify-end">
          <a
            href={data.completionCta.url}
            className="bg-primary text-on-primary px-10 py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
          >
            {data.completionCta.label}
          </a>
        </div>
      )}
    </section>
  );
}
