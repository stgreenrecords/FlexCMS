export interface LocationCardAltCta {
  label: string;
  url: string;
}

export interface LocationCardAltData {
  title: string;
  description: string;
  /** list<reference> */
  items: string[];
  layout: 'grid' | 'list';
  cta: LocationCardAltCta;
}

interface Props {
  data: LocationCardAltData;
}

export function LocationCardAlt({ data }: Props) {
  const { title, description, items, layout, cta } = data;

  return (
    <section className="flex flex-col gap-4">
      {title && (
        <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
      )}
      {description && (
        <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
      )}
      {items && items.length > 0 && (
        <ul
          className={
            layout === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
              : 'flex flex-col gap-2'
          }
          aria-label="Location items"
        >
          {items.map((item, index) => (
            <li
              key={index}
              className="px-4 py-3 rounded-lg border border-outline-variant/20 bg-surface-container text-sm text-on-surface font-label"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
      {cta && cta.url && cta.label && (
        <a
          href={cta.url}
          className="mt-2 inline-flex items-center justify-center px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-label font-semibold hover:opacity-90 transition-opacity w-fit"
        >
          {cta.label}
        </a>
      )}
    </section>
  );
}
