export interface LicenseOption {
  name: string;
  description: string;
  price: number;
  billingPeriod: string;
  features: string[];
  cta: { label: string; url: string };
}

export interface LicenseSelectorData {
  title: string;
  licenseOptions: LicenseOption[];
  comparisonMode: boolean;
}

export function LicenseSelector({ data }: { data: LicenseSelectorData }) {
  return (
    <section className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      {data.licenseOptions && data.licenseOptions.length > 0 && (
        <div className={`grid grid-cols-1 gap-6 ${data.licenseOptions.length > 1 ? 'md:grid-cols-' + Math.min(data.licenseOptions.length, 3) : ''}`}>
          {data.licenseOptions.map((opt, i) => (
            <div key={i} className="border border-outline-variant/30 p-8 flex flex-col">
              <h3 className="font-label uppercase text-xs tracking-widest text-primary mb-2">{opt.name}</h3>
              {opt.description && <p className="font-body text-sm text-secondary mb-4">{opt.description}</p>}
              <div className="mb-6">
                <span className="font-headline text-3xl text-on-surface">
                  {typeof opt.price === 'number' ? `$${opt.price.toLocaleString()}` : opt.price}
                </span>
                {opt.billingPeriod && (
                  <span className="font-label text-xs text-secondary ml-2">{opt.billingPeriod}</span>
                )}
              </div>
              {opt.features && opt.features.length > 0 && (
                <ul className="space-y-2 mb-8 flex-1">
                  {opt.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 font-body text-sm text-secondary">
                      <span className="text-primary mt-0.5">✓</span> {f}
                    </li>
                  ))}
                </ul>
              )}
              {opt.cta?.label && (
                <a
                  href={opt.cta.url}
                  className="block text-center bg-primary text-on-primary py-3 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all"
                >
                  {opt.cta.label}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
