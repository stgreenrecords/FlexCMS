export interface AnalystReportPromoData {
  title: string;
  summary: string;
  provider: string;
  /** Report asset file */
  assetFile: string;
  gated: boolean;
}

interface Props {
  data: AnalystReportPromoData;
}

export function AnalystReportPromo({ data }: Props) {
  const { title, summary, provider, assetFile, gated } = data;

  return (
    <article className="bg-surface-container rounded-xl p-6 border border-outline-variant">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="font-headline text-xl text-[var(--color-on-surface)]">{title}</h2>
        {gated && (
          <span className="font-label text-xs bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] rounded-full px-3 py-1 shrink-0">
            Gated
          </span>
        )}
      </div>
      <p className="font-label text-sm text-[var(--color-primary)] mb-3">{provider}</p>
      <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed mb-5">{summary}</p>
      {gated ? (
        <button
          type="button"
          className="font-label text-sm bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded px-5 py-2 hover:opacity-90 transition-opacity"
        >
          Request Access
        </button>
      ) : (
        <a
          href={assetFile}
          download
          className="font-label text-sm bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded px-5 py-2 inline-block hover:opacity-90 transition-opacity"
        >
          Download Report
        </a>
      )}
    </article>
  );
}
