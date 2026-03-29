'use client';

interface Props { data: Record<string, unknown> }

export function BackToTop({ data }: Props) {
  const label = (data.label as string) ?? 'Back to top';

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white uppercase tracking-widest transition-colors duration-200 bg-transparent border-none cursor-pointer p-0"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }}
      aria-label={label}
    >
      <span aria-hidden="true">&#8593;</span>
      {label}
    </button>
  );
}
