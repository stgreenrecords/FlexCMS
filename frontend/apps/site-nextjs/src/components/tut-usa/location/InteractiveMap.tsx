export interface LegendItem {
  label: string;
  color: string;
}

export interface InteractiveMapData {
  title: string;
  mapDataSource: string;
  defaultRegion: string;
  legend: LegendItem[];
}

interface Props {
  data: InteractiveMapData;
}

export function InteractiveMap({ data }: Props) {
  const { title, mapDataSource, defaultRegion, legend } = data;

  return (
    <section className="flex flex-col gap-4">
      {title && (
        <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
      )}
      {defaultRegion && (
        <p className="text-sm text-on-surface-variant font-label">
          Region: {defaultRegion}
        </p>
      )}
      <a
        href={mapDataSource}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-xl border border-outline-variant/20 bg-surface-container min-h-[280px] flex items-center justify-center text-sm text-primary font-label underline hover:bg-surface-container-high transition-colors"
        aria-label={`Open interactive map for ${defaultRegion}`}
      >
        Open interactive map
      </a>
      {legend && legend.length > 0 && (
        <ul className="flex flex-wrap gap-3" aria-label="Map legend">
          {legend.map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-on-surface-variant font-label">
              <span
                className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
