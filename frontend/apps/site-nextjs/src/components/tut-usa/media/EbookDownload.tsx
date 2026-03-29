export interface EbookDownloadData {
  title: string;
  description: string;
  /** Cover image — 300×400 */
  coverImage: string;
  /** File — 48×48 icon */
  file: string;
  gated: boolean;
}

const safeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');

export function EbookDownload({ data }: { data: EbookDownloadData }) {
  return (
    <section className="py-8 bg-surface">
      <div className="bg-surface-container-low rounded-lg p-6 flex gap-6">
        {data.coverImage && (
          <div className="flex-shrink-0 w-24 bg-surface-container-highest rounded overflow-hidden">
            <img
              src={data.coverImage}
              alt={data.title}
              className="w-full object-cover"
              style={{ aspectRatio: '3/4' }}
              loading="lazy"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {data.title && (
            <h3 className="text-on-surface font-semibold text-lg mb-2">{data.title}</h3>
          )}
          {data.description && (
            <div
              className="text-on-surface-variant text-sm mb-4 prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: safeHtml(data.description) }}
            />
          )}
          {data.gated && (
            <p className="text-xs text-primary mb-3">Free registration required</p>
          )}
          {data.file && (
            <a
              href={data.gated ? '#gated-form' : data.file}
              download={!data.gated}
              className="inline-block px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded transition hover:opacity-90"
            >
              {data.gated ? 'Get Free eBook' : 'Download eBook'}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
