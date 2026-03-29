export interface SecFilingDownloadData {
  title: string;
  filingType: string;
  /** Download link asset */
  file: string;
  filingDate: string;
}

interface Props {
  data: SecFilingDownloadData;
}

export function SecFilingDownload({ data }: Props) {
  const { title, filingType, file, filingDate } = data;

  return (
    <div className="bg-surface-container rounded-xl p-5 border border-outline-variant flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <span className="font-label text-xs text-[var(--color-primary)] uppercase tracking-wide">{filingType}</span>
        <h3 className="font-headline text-base text-[var(--color-on-surface)] mt-0.5 truncate">{title}</h3>
        <time className="text-sm text-[var(--color-on-surface-variant)]" dateTime={filingDate}>
          {filingDate}
        </time>
      </div>
      <a
        href={file}
        download
        className="font-label text-sm text-[var(--color-primary)] border border-[var(--color-primary)] rounded px-4 py-2 hover:bg-[var(--color-primary-container)] transition-colors whitespace-nowrap"
      >
        Download
      </a>
    </div>
  );
}
