export interface EarningsCallPromoData {
  title: string;
  dateTime: string;
  webcastUrl: string;
  /** Transcript asset */
  transcriptFile: string;
}

interface Props {
  data: EarningsCallPromoData;
}

export function EarningsCallPromo({ data }: Props) {
  const { title, dateTime, webcastUrl, transcriptFile } = data;

  return (
    <section className="bg-surface-container rounded-xl p-6 border border-outline-variant">
      <h2 className="font-headline text-xl text-[var(--color-on-surface)] mb-2">{title}</h2>
      <time className="block text-sm text-[var(--color-on-surface-variant)] mb-5" dateTime={dateTime}>
        {dateTime}
      </time>
      <div className="flex flex-wrap gap-3">
        <a
          href={webcastUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-label text-sm bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded px-5 py-2 hover:opacity-90 transition-opacity"
        >
          Join Webcast
        </a>
        {transcriptFile && (
          <a
            href={transcriptFile}
            download
            className="font-label text-sm border border-outline-variant text-[var(--color-on-surface)] rounded px-5 py-2 hover:bg-[var(--color-surface-container-high)] transition-colors"
          >
            Download Transcript
          </a>
        )}
      </div>
    </section>
  );
}
