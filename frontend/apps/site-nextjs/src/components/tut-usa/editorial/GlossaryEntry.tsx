export interface GlossaryEntryData {
  term: string;
  definition: string;
  relatedTerms: string[];
}

interface Props {
  data: GlossaryEntryData;
}

export function GlossaryEntry({ data }: Props) {
  const { term, definition, relatedTerms } = data;

  return (
    <div className="py-4 border-b border-outline-variant/20 last:border-0">
      <dt className="font-headline italic text-on-surface text-lg mb-2">{term}</dt>
      <dd className="text-sm text-on-surface-variant leading-relaxed mb-3">{definition}</dd>
      {relatedTerms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant mr-1">
            See also:
          </span>
          {relatedTerms.map((t, i) => (
            <span
              key={i}
              className="text-xs text-primary border border-primary/30 rounded px-2 py-0.5"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
