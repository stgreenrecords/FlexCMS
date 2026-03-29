export interface BenefitsListData {
  title: string;
  benefits: { title: string; description: string; icon?: string }[];
  layout: 'grid' | 'list';
}

interface Props {
  data: BenefitsListData;
}

export function BenefitsList({ data }: Props) {
  const { title, benefits, layout } = data;

  const containerClass =
    layout === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
      : 'flex flex-col gap-3';

  return (
    <section className="py-4">
      <h2 className="font-headline text-2xl text-[var(--color-on-surface)] mb-6">{title}</h2>
      <ul className={containerClass}>
        {benefits.map((benefit, i) => (
          <li
            key={i}
            className="bg-surface-container rounded-xl p-5 border border-outline-variant flex gap-4"
          >
            {benefit.icon && (
              <img
                src={benefit.icon}
                alt=""
                width={32}
                height={32}
                className="w-8 h-8 object-contain shrink-0 mt-0.5"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-headline text-base text-[var(--color-on-surface)] mb-1">{benefit.title}</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">{benefit.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
