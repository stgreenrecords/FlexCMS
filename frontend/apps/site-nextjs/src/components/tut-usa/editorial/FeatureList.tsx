export interface FeatureListData {
  title: string;
  features: { title: string; description: string; icon?: string }[];
  iconStyle: 'filled' | 'outlined' | 'none';
}

interface Props {
  data: FeatureListData;
}

export function FeatureList({ data }: Props) {
  const { title, features, iconStyle } = data;

  return (
    <section className="py-8">
      {title && (
        <h2 className="font-headline italic text-on-surface text-3xl mb-8">{title}</h2>
      )}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <li
            key={i}
            className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-3"
          >
            {iconStyle !== 'none' && feature.icon && (
              <img
                src={feature.icon}
                alt=""
                width={32}
                height={32}
                aria-hidden="true"
                className={`${iconStyle === 'outlined' ? 'opacity-70' : ''}`}
              />
            )}
            <h3 className="font-label tracking-widest uppercase text-sm text-on-surface">
              {feature.title}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {feature.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
