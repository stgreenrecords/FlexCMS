export interface MealPlanCardData {
  title: string;
  description: string;
  price: number;
  includedMeals: number;
  cta: { label: string; url: string };
}

export function MealPlanCard({ data }: { data: MealPlanCardData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-8">
      <h3 className="font-headline italic text-2xl text-on-surface mb-3">{data.title}</h3>
      {data.description && <p className="font-body text-sm text-secondary mb-4">{data.description}</p>}
      {data.includedMeals > 0 && (
        <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-6">
          {data.includedMeals} meals included
        </span>
      )}
      <div className="flex items-center justify-between">
        <span className="font-headline text-3xl text-primary">
          {typeof data.price === 'number' ? `$${data.price.toLocaleString()}` : data.price}
        </span>
        {data.cta?.label && (
          <a
            href={data.cta.url}
            className="bg-primary text-on-primary px-6 py-3 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all"
          >
            {data.cta.label}
          </a>
        )}
      </div>
    </div>
  );
}
