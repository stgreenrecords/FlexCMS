export interface InternalNoteData {
  title: string;
  note: string;
  visibility: 'internal' | 'public';
}

interface Props {
  data: InternalNoteData;
}

export function InternalNote({ data }: Props) {
  const { title, note, visibility } = data;

  const badgeClass =
    visibility === 'internal'
      ? 'bg-[var(--color-error-container)] text-[var(--color-on-error-container)]'
      : 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]';

  return (
    <aside className="bg-surface-container rounded-xl p-5 border border-outline-variant">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-headline text-base text-[var(--color-on-surface)]">{title}</h3>
        <span className={`font-label text-xs rounded px-2 py-0.5 capitalize shrink-0 ${badgeClass}`}>
          {visibility}
        </span>
      </div>
      <p className="text-sm text-[var(--color-on-surface)] whitespace-pre-line leading-relaxed">{note}</p>
    </aside>
  );
}
