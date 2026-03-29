export interface KnowledgePanelData {
  title: string;
  summary: string;
  keyLinks: { label: string; url: string }[];
  metadata: { label: string; value: string }[];
}

interface Props {
  data: KnowledgePanelData;
}

export function KnowledgePanel({ data }: Props) {
  const { title, summary, keyLinks, metadata } = data;

  return (
    <aside className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-5">
      <h3 className="font-headline italic text-on-surface text-xl">{title}</h3>
      {summary && (
        <p className="text-sm text-on-surface-variant leading-relaxed">{summary}</p>
      )}
      {metadata.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-outline-variant/20 pt-4">
          {metadata.map((m, i) => (
            <div key={i} className="contents">
              <dt className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
                {m.label}
              </dt>
              <dd className="text-xs text-on-surface">{m.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {keyLinks.length > 0 && (
        <div className="border-t border-outline-variant/20 pt-4">
          <p className="font-label tracking-widest uppercase text-xs text-on-surface-variant mb-3">
            Key Links
          </p>
          <ul className="flex flex-col gap-2">
            {keyLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
