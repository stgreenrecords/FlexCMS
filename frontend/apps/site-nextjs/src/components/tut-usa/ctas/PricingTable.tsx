'use client';

import { useState } from 'react';

export interface PricingPlan {
  name: string;
  price: string;
  billingLabel: string;
  features: string[];
  cta: { label: string; url: string };
  badge: string;
}

export interface PricingTableData {
  title: string;
  plans: PricingPlan[];
  highlightedPlan: string;
  billingToggle: boolean;
}

export function PricingTable({ data }: { data: PricingTableData }) {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="px-12 py-32 bg-surface-container-lowest">
      {data.title && (
        <div className="text-center mb-16">
          <h2 className="font-headline italic text-5xl mb-4 text-on-surface">{data.title}</h2>
        </div>
      )}
      {data.billingToggle && (
        <div className="flex justify-center mb-12 gap-4 items-center">
          <span className={`font-label text-xs uppercase tracking-widest ${annual ? 'text-on-surface' : 'text-secondary'}`}>Annual</span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative w-12 h-6 bg-outline-variant rounded-full transition-colors"
            aria-label="Toggle billing period"
          >
            <span className={`absolute top-1 w-4 h-4 bg-primary rounded-full transition-all ${annual ? 'left-1' : 'left-7'}`} />
          </button>
          <span className={`font-label text-xs uppercase tracking-widest ${!annual ? 'text-on-surface' : 'text-secondary'}`}>Monthly</span>
        </div>
      )}
      {data.plans && data.plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {data.plans.map((plan, i) => {
            const highlighted = plan.name === data.highlightedPlan;
            return (
              <div
                key={i}
                className={`p-12 flex flex-col items-center text-center relative ${highlighted ? 'bg-surface-container-high scale-105 z-10 shadow-2xl' : 'border border-outline-variant/20'}`}
              >
                {plan.badge && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-6 py-1 text-xs font-bold uppercase tracking-[0.2em]">
                    {plan.badge}
                  </div>
                )}
                <span className={`font-label text-xs tracking-[0.2em] uppercase mb-8 mt-4 ${highlighted ? 'text-primary' : 'text-secondary'}`}>
                  {plan.name}
                </span>
                <div className="mb-12">
                  <span className="font-headline text-5xl text-on-surface">{plan.price}</span>
                  {plan.billingLabel && (
                    <span className="font-label text-xs text-secondary block mt-2 uppercase">{plan.billingLabel}</span>
                  )}
                </div>
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-6 mb-16 font-body text-sm text-secondary w-full">
                    {plan.features.map((f, j) => (
                      <li key={j}>{f}</li>
                    ))}
                  </ul>
                )}
                {plan.cta?.label && (
                  <a
                    href={plan.cta.url}
                    className={`w-full py-4 font-label font-bold uppercase tracking-widest transition-all text-center block ${highlighted ? 'bg-primary text-on-primary hover:bg-primary-fixed' : 'border border-outline-variant text-on-surface hover:bg-surface-container'}`}
                  >
                    {plan.cta.label}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
