export interface StoreLocatorData {
  title: string;
  apiEndpoint: string;
  searchRadius: number;
  showFilters: boolean;
}

interface Props {
  data: StoreLocatorData;
}

export function StoreLocator({ data }: Props) {
  const { title, searchRadius, showFilters } = data;

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
          aria-label="Search location"
          readOnly
        />
        <button
          type="button"
          className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-label font-semibold"
        >
          Search
        </button>
      </div>
      <p className="text-xs text-on-surface-variant font-label">
        Search radius: {searchRadius} miles
      </p>
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full border border-outline-variant/40 bg-surface-container text-xs text-on-surface-variant font-label">
            Filters
          </span>
        </div>
      )}
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6 text-center text-sm text-on-surface-variant font-label min-h-[120px] flex items-center justify-center">
        Results will appear here
      </div>
    </section>
  );
}
