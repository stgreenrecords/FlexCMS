export interface CourseCatalogData {
  title: string;
  courses: string[];
  filters: { label: string; value: string }[];
  searchEnabled: boolean;
}

interface Props {
  data: CourseCatalogData;
}

export function CourseCatalog({ data }: Props) {
  const { title, filters, searchEnabled } = data;

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-headline text-3xl text-on-surface">{title}</h2>

      <div className="flex flex-col gap-4">
        {searchEnabled && (
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Search courses…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Course filters">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className="px-4 py-1.5 rounded-full border border-outline-variant bg-surface-container text-sm font-label text-secondary hover:border-primary hover:text-primary transition-colors"
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
