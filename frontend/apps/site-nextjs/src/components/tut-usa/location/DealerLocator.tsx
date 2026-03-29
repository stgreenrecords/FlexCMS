export interface DealerFilter {
  label: string;
  value: string;
}

export interface DealerLocatorData {
  title: string;
  apiEndpoint: string;
  radiusOptions: number[];
  filters: DealerFilter[];
}

interface Props {
  data: DealerLocatorData;
}

export function DealerLocator({ data }: Props) {
  const { title, radiusOptions, filters } = data;

  return (
    <section className="flex flex-col gap-4">
      {title && (
        <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Enter zip code or city"
          className="flex-1 rounded-lg border border-outline-variant/40 bg-surface-container px-4 py-2 text-sm text-on-surface font-label placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Search dealer location"
          readOnly
        />
        {radiusOptions && radiusOptions.length > 0 && (
          <select
            aria-label="Search radius"
            className="rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-sm text-on-surface font-label focus:outline-none focus:ring-2 focus:ring-primary/40"
            defaultValue={radiusOptions[0]}
          >
            {radiusOptions.map((radius, index) => (
              <option key={index} value={radius}>
                {radius} miles
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-label font-semibold"
        >
          Find Dealer
        </button>
      </div>
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Dealer filters">
          {filters.map((filter, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-full border border-outline-variant/40 bg-surface-container text-xs text-on-surface-variant font-label cursor-pointer hover:bg-surface-container-high transition-colors"
              data-value={filter.value}
            >
              {filter.label}
            </span>
          ))}
        </div>
      )}
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6 text-center text-sm text-on-surface-variant font-label min-h-[120px] flex items-center justify-center">
        Dealer results will appear here
      </div>
    </section>
  );
}
