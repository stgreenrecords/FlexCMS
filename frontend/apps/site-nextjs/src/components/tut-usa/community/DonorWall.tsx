export interface Donor {
  name: string;
  level?: string;
  amount?: number;
}

export interface DonorWallData {
  title: string;
  donors: Donor[];
  groupByLevel: boolean;
}

interface Props {
  data: DonorWallData;
}

export function DonorWall({ data }: Props) {
  const { title, donors, groupByLevel } = data;

  if (!donors || donors.length === 0) {
    return (
      <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
        {title && <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>}
        <p className="text-sm text-on-surface-variant">No donors to display.</p>
      </section>
    );
  }

  if (groupByLevel) {
    const levels: Record<string, Donor[]> = {};
    donors.forEach((donor) => {
      const lvl = donor.level ?? 'General';
      if (!levels[lvl]) levels[lvl] = [];
      levels[lvl].push(donor);
    });

    return (
      <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-6">
        {title && <h2 className="font-headline italic text-on-surface text-2xl">{title}</h2>}
        {Object.entries(levels).map(([level, levelDonors]) => (
          <div key={level} className="flex flex-col gap-3">
            <span className="font-label uppercase text-xs tracking-widest text-secondary border-b border-outline-variant/40 pb-1">
              {level}
            </span>
            <div className="flex flex-wrap gap-2">
              {levelDonors.map((donor, i) => (
                <span
                  key={i}
                  className="bg-surface-container border border-outline-variant/40 text-on-surface text-sm px-3 py-1 rounded-full"
                >
                  {donor.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      {title && <h2 className="font-headline italic text-on-surface text-2xl">{title}</h2>}
      <div className="flex flex-wrap gap-2">
        {donors.map((donor, i) => (
          <span
            key={i}
            className="bg-surface-container border border-outline-variant/40 text-on-surface text-sm px-3 py-1 rounded-full"
          >
            {donor.name}
          </span>
        ))}
      </div>
    </section>
  );
}
