export interface WhitepaperDownloadData {
  title: string;
  abstract: string;
  /** File — 48×48 icon */
  file: string;
  gated: boolean;
  formReference: string;
}

const safeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');

export function WhitepaperDownload({ data }: { data: WhitepaperDownloadData }) {
  return (
    <section className="py-8 bg-surface">
      <div className="bg-surface-container-low rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex-shrink-0 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary font-bold text-xs uppercase">
            WP
          </div>
          <div className="flex-1 min-w-0">
            {data.title && (
              <h3 className="text-on-surface font-semibold mb-2">{data.title}</h3>
            )}
            {data.abstract && (
              <div
                className="text-on-surface-variant text-sm mb-4 prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: safeHtml(data.abstract) }}
              />
            )}
            {data.gated && (
              <p className="text-xs text-primary mb-3">Registration required to download</p>
            )}
            {data.gated && data.formReference ? (
              <a
                href={`#${data.formReference}`}
                className="inline-block px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded transition hover:opacity-90"
              >
                Access Whitepaper
              </a>
            ) : (
              data.file && (
                <a
                  href={data.file}
                  download
                  className="inline-block px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded transition hover:opacity-90"
                >
                  Download Whitepaper
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
