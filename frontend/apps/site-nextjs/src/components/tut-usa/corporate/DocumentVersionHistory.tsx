export interface DocumentVersionHistoryData {
  documentTitle: string;
  versions: { version: string; date: string; summary: string }[];
  currentVersion: string;
}

interface Props {
  data: DocumentVersionHistoryData;
}

export function DocumentVersionHistory({ data }: Props) {
  const { documentTitle, versions, currentVersion } = data;

  return (
    <section className="bg-surface-container rounded-xl p-6 border border-outline-variant">
      <h2 className="font-headline text-xl text-[var(--color-on-surface)] mb-1">{documentTitle}</h2>
      <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">
        Current version: <strong className="text-[var(--color-on-surface)]">{currentVersion}</strong>
      </p>
      <ol className="flex flex-col gap-3">
        {versions.map((v, i) => {
          const isCurrent = v.version === currentVersion;
          return (
            <li
              key={i}
              className={`flex gap-4 p-3 rounded-lg border ${
                isCurrent
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-container)]'
                  : 'border-outline-variant'
              }`}
            >
              <span className="font-label text-sm font-semibold text-[var(--color-primary)] w-14 shrink-0">
                v{v.version}
              </span>
              <div className="min-w-0">
                <time className="block text-xs text-[var(--color-on-surface-variant)] mb-0.5" dateTime={v.date}>
                  {v.date}
                </time>
                <p className="text-sm text-[var(--color-on-surface)]">{v.summary}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
