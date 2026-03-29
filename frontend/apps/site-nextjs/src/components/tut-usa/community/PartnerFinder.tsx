export interface PartnerFinderFilter {
  label: string;
  options: string[];
}

export interface PartnerFinderData {
  title: string;
  apiEndpoint: string;
  filters: PartnerFinderFilter[];
  mapEnabled: boolean;
}

interface Props {
  data: PartnerFinderData;
}

export function PartnerFinder({ data }: Props) {
  const { title, filters, mapEnabled } = data;

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-6">
      {title && (
        <h2 className="font-headline italic text-on-surface text-2xl">{title}</h2>
      )}
      {/* Filter UI */}
      {filters && filters.length > 0 && (
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-wrap gap-4"
        >
          {filters.map((filter, i) => (
            <div key={i} className="flex flex-col gap-1">
              <label className="font-label uppercase text-xs tracking-widest text-secondary">
                {filter.label}
              </label>
              <select
                className="bg-surface-container border border-outline-variant/40 text-on-surface text-sm rounded px-3 py-2 focus:outline-none focus:border-primary"
                defaultValue=""
              >
                <option value="" disabled>
                  Select {filter.label}
                </option>
                {filter.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-primary text-on-primary font-label uppercase text-xs tracking-widest px-5 py-2.5 rounded hover:bg-primary-fixed transition-colors"
            >
              Find Partners
            </button>
          </div>
        </form>
      )}
      {/* Map placeholder */}
      {mapEnabled && (
        <div className="rounded-lg border border-outline-variant/40 bg-surface-container flex items-center justify-center h-64 text-on-surface-variant text-sm">
          Map loading…
        </div>
      )}
      {/* Results placeholder */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="bg-surface-container rounded-lg border border-outline-variant/40 p-4 flex flex-col gap-2 animate-pulse"
          >
            <div className="h-3 rounded bg-outline-variant/40 w-40" />
            <div className="h-3 rounded bg-outline-variant/40 w-full" />
            <div className="h-3 rounded bg-outline-variant/40 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  );
}
