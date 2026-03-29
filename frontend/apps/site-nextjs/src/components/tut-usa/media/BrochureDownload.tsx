export interface BrochureDownloadData {
  title: string;
  summary: string;
  /** Brochure file — 48×48 icon */
  brochureFile: string;
  gated: boolean;
  formReference: string;
}

export function BrochureDownload({ data }: { data: BrochureDownloadData }) {
  return (
    <section className="py-8 bg-surface">
      <div className="flex items-center gap-4 bg-surface-container-low rounded-lg p-6">
        <div className="w-12 h-12 flex-shrink-0 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary font-bold text-xs uppercase">
          PDF
        </div>
        <div className="flex-1 min-w-0">
          {data.title && (
            <h3 className="text-on-surface font-semibold truncate">{data.title}</h3>
          )}
          {data.summary && (
            <p className="text-on-surface-variant text-sm mt-1 line-clamp-2">
              {data.summary}
            </p>
          )}
          {data.gated && (
            <p className="text-xs text-primary mt-1">Registration required</p>
          )}
        </div>
        {data.gated && data.formReference ? (
          <a
            href={`#${data.formReference}`}
            className="flex-shrink-0 px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded transition hover:opacity-90"
          >
            Get Brochure
          </a>
        ) : (
          data.brochureFile && (
            <a
              href={data.brochureFile}
              download
              className="flex-shrink-0 px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded transition hover:opacity-90"
            >
              Download
            </a>
          )
        )}
      </div>
    </section>
  );
}
