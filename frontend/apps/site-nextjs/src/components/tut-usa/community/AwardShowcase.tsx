export interface Award {
  name: string;
  organization: string;
  year: string;
  logo?: string;
}

export interface AwardShowcaseData {
  title: string;
  awards: Award[];
  layout: string;
}

interface Props {
  data: AwardShowcaseData;
}

export function AwardShowcase({ data }: Props) {
  const { title, awards, layout } = data;
  const isGrid = layout !== 'list';

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      {title && (
        <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
      )}
      {awards && awards.length > 0 ? (
        isGrid ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {awards.map((award, i) => (
              <div
                key={i}
                className="bg-surface-container rounded-lg border border-outline-variant/40 p-4 flex flex-col items-center gap-2 text-center"
              >
                {award.logo && (
                  <img
                    src={award.logo}
                    alt={award.name}
                    width={64}
                    height={64}
                    className="w-12 h-12 object-contain"
                  />
                )}
                <span className="font-body text-on-surface text-sm font-medium leading-tight">{award.name}</span>
                <span className="font-label uppercase text-xs tracking-widest text-secondary">{award.organization}</span>
                <span className="font-label uppercase text-xs tracking-widest text-on-surface-variant">{award.year}</span>
              </div>
            ))}
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-outline-variant/40 list-none p-0">
            {awards.map((award, i) => (
              <li key={i} className="flex items-center gap-4 py-3">
                {award.logo && (
                  <img
                    src={award.logo}
                    alt={award.name}
                    width={48}
                    height={48}
                    className="w-10 h-10 object-contain flex-shrink-0"
                  />
                )}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="font-body text-on-surface text-sm font-medium">{award.name}</span>
                  <span className="font-label uppercase text-xs tracking-widest text-secondary">{award.organization}</span>
                </div>
                <span className="font-label uppercase text-xs tracking-widest text-on-surface-variant flex-shrink-0">{award.year}</span>
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="text-sm text-on-surface-variant">No awards to display.</p>
      )}
    </section>
  );
}
