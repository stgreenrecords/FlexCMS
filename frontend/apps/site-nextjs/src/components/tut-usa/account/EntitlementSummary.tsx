export interface Entitlement {
  name: string;
  description: string;
  active: boolean;
}

export interface EntitlementSummaryData {
  title: string;
  entitlements: Entitlement[];
  renewalDate: string;
  upgradeUrl: string;
}

export function EntitlementSummary({ data }: { data: EntitlementSummaryData }) {
  return (
    <section className="bg-surface-container p-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-headline italic text-3xl text-on-surface">{data.title}</h2>
        {data.renewalDate && (
          <span className="font-label uppercase text-xs tracking-widest text-secondary">Renews: {data.renewalDate}</span>
        )}
      </div>
      {data.entitlements && data.entitlements.length > 0 && (
        <ul className="space-y-3 mb-8">
          {data.entitlements.map((e, i) => (
            <li key={i} className="flex items-start gap-3 border-b border-outline-variant/10 pb-3">
              <span className={`mt-0.5 text-sm ${e.active ? 'text-primary' : 'text-outline-variant/40'}`}>
                {e.active ? '✓' : '○'}
              </span>
              <div>
                <span className="font-label text-xs uppercase tracking-widest text-on-surface block">{e.name}</span>
                {e.description && <span className="font-body text-xs text-secondary">{e.description}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {data.upgradeUrl && (
        <a href={data.upgradeUrl} className="font-label uppercase text-xs tracking-widest text-primary hover:underline">
          Upgrade Plan →
        </a>
      )}
    </section>
  );
}
