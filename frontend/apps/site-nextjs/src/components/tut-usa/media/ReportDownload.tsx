export interface ReportDownloadData {
  title: string;
  summary: string;
  /** Report file — 48×48 icon */
  reportFile: string;
  publishDate: string;
  gated: boolean;
}

const safeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');

export function ReportDownload({ data }: { data: ReportDownloadData }) {
  return (
    <section className="py-8 bg-surface">
      <div className="flex items-center gap-4 bg-surface-container-low rounded-lg p-6">
        <div className="w-12 h-12 flex-shrink-0 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary font-bold text-xs uppercase">
          RPT
        </div>
        <div className="flex-1 min-w-0">
          {data.title && (
            <h3 className="text-on-surface font-semibold truncate">{data.title}</h3>
          )}
          {data.publishDate && (
            <p className="text-xs text-on-surface-variant/60 mt-0.5">{data.publishDate}</p>
          )}
          {data.summary && (
            <div
              className="text-on-surface-variant text-sm mt-2 line-clamp-3 prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: safeHtml(data.summary) }}
            />
          )}
          {data.gated && (
            <p className="text-xs text-primary mt-1">Registration required</p>
          )}
        </div>
        {data.reportFile && (
          <a
            href={data.gated ? '#gated-form' : data.reportFile}
            download={!data.gated}
            className="flex-shrink-0 px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded transition hover:opacity-90"
          >
            {data.gated ? 'Access Report' : 'Download'}
          </a>
        )}
      </div>
    </section>
  );
}
