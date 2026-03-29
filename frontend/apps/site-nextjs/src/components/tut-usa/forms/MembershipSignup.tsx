export interface MembershipPlan {
  name: string;
  price: string;
  billingPeriod: string;
}

export interface MembershipSignupData {
  title: string;
  benefits: string[];
  plans: MembershipPlan[];
  cta: { label: string; url: string };
}

export function MembershipSignup({ data }: { data: MembershipSignupData }) {
  return (
    <section className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      {data.benefits && data.benefits.length > 0 && (
        <ul className="space-y-3 mb-10">
          {data.benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-3 font-body text-sm text-secondary">
              <span className="text-primary mt-0.5">✓</span> {b}
            </li>
          ))}
        </ul>
      )}
      {data.plans && data.plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {data.plans.map((plan, i) => (
            <div
              key={i}
              className="border border-outline-variant/30 p-6 flex justify-between items-center hover:border-primary transition-all cursor-pointer"
            >
              <div>
                <span className="font-label text-xs uppercase tracking-widest text-on-surface block">
                  {plan.name}
                </span>
                {plan.billingPeriod && (
                  <span className="font-label text-xs text-secondary">{plan.billingPeriod}</span>
                )}
              </div>
              <span className="font-headline text-2xl text-primary">{plan.price}</span>
            </div>
          ))}
        </div>
      )}
      {data.cta?.label && (
        <a
          href={data.cta.url}
          className="block w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all text-center"
        >
          {data.cta.label}
        </a>
      )}
    </section>
  );
}
