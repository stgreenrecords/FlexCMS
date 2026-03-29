interface Props { data: Record<string, unknown> }

export function SearchBar({ data }: Props) {
  const placeholder = (data.placeholder as string) ?? 'Search…';

  return (
    <div className="relative w-full max-w-lg">
      <input
        type="search"
        placeholder={placeholder}
        className="w-full bg-neutral-900 border border-neutral-700 rounded px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white"
        aria-label={placeholder}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
        &#x2315;
      </span>
    </div>
  );
}
