export interface FactSheetData {
  title: string;
  facts: { label: string; value: string }[];
  /** Download file icon — 48×48 */
  downloadFile: string;
}

interface Props {
  data: FactSheetData;
}

export function FactSheet({ data }: Props) {
  const { title, facts, downloadFile } = data;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        {title && (
          <h2 className="font-headline italic text-on-surface text-3xl">{title}</h2>
        )}
        {downloadFile && (
          <a
            href={downloadFile}
            download
            className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 hover:border-primary/40 transition-colors"
          >
            <img
              src={downloadFile}
              alt=""
              width={48}
              height={48}
              aria-hidden="true"
              className="w-6 h-6 object-contain"
            />
            <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
              Download
            </span>
          </a>
        )}
      </div>
      <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-outline-variant/20 border border-outline-variant/20 rounded-lg overflow-hidden">
        {facts.map((fact, i) => (
          <div key={i} className="bg-surface-container-low p-5 flex flex-col gap-1">
            <dt className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
              {fact.label}
            </dt>
            <dd className="font-headline italic text-on-surface text-xl">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
