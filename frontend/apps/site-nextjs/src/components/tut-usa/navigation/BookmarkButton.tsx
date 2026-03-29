interface Props { data: Record<string, unknown> }

export function BookmarkButton({ data }: Props) {
  const label = (data.label as string) ?? 'Bookmark';

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white uppercase tracking-widest transition-colors duration-200 bg-transparent border border-neutral-700 hover:border-white rounded px-4 py-2 cursor-pointer"
      aria-label={label}
    >
      <span aria-hidden="true" className="text-base leading-none">&#9825;</span>
      {label}
    </button>
  );
}
