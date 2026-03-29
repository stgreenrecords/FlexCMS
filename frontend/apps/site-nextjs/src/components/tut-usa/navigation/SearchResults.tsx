interface Props { data: Record<string, unknown> }

export function SearchResults({ data }: Props) {
  const title = (data.title as string) ?? 'Search Results';
  const showFilters = (data.showFilters as boolean) ?? false;
  const resultsPerPage = (data.resultsPerPage as number) ?? 10;

  return (
    <div className="w-full bg-black text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light tracking-widest uppercase">{title}</h2>
        {showFilters && (
          <span className="text-xs text-neutral-400 uppercase tracking-widest">
            Filters
          </span>
        )}
      </div>
      <p className="text-neutral-500 text-sm py-8 text-center border border-neutral-800 rounded">
        Search results will appear here.
      </p>
      <p className="text-xs text-neutral-700 mt-2">Results per page: {resultsPerPage}</p>
    </div>
  );
}
