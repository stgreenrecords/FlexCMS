export interface AtmLocatorData {
  title: string;
  apiEndpoint: string;
  feeFreeOnly: boolean;
  accessibilityFilters: string[];
}

interface Props {
  data: AtmLocatorData;
}

export function AtmLocator({ data }: Props) {
  const { title, feeFreeOnly, accessibilityFilters } = data;

  return (
    <section className="flex flex-col gap-4">
      {title && (
        <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
      )}
      <div className="flex items-center gap-3">
        <span
          role="switch"
          aria-checked={feeFreeOnly}
          aria-label="Fee-free ATMs only"
          className={`inline-flex items-center w-10 h-6 rounded-full border transition-colors ${
            feeFreeOnly
              ? 'bg-primary border-primary'
              : 'bg-surface-container border-outline-variant/40'
          }`}
        >
          <span
            className={`inline-block w-4 h-4 rounded-full bg-on-primary shadow transition-transform ${
              feeFreeOnly ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </span>
        <span className="text-sm text-on-surface-variant font-label">Fee-free only</span>
      </div>
      {accessibilityFilters && accessibilityFilters.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Accessibility filters">
          {accessibilityFilters.map((filter, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-full border border-outline-variant/40 bg-surface-container text-xs text-on-surface-variant font-label cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              {filter}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Enter zip code or city"
          className="flex-1 rounded-lg border border-outline-variant/40 bg-surface-container px-4 py-2 text-sm text-on-surface font-label placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Search ATM location"
          readOnly
        />
        <button
          type="button"
          className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-label font-semibold"
        >
          Find ATM
        </button>
      </div>
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6 text-center text-sm text-on-surface-variant font-label min-h-[120px] flex items-center justify-center">
        ATM results will appear here
      </div>
    </section>
  );
}
