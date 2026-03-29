export interface DocumentDownloadData {
  title: string;
  description: string;
  /** Document file — 48×48 icon */
  file: string;
  fileType: string;
  fileSize: string;
}

export function DocumentDownload({ data }: { data: DocumentDownloadData }) {
  return (
    <section className="py-8 bg-surface">
      <div className="flex items-center gap-4 bg-surface-container-low rounded-lg p-6">
        <div className="w-12 h-12 flex-shrink-0 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary font-bold text-xs uppercase">
          {data.fileType || 'FILE'}
        </div>
        <div className="flex-1 min-w-0">
          {data.title && (
            <h3 className="text-on-surface font-semibold truncate">{data.title}</h3>
          )}
          {data.description && (
            <p className="text-on-surface-variant text-sm mt-1 line-clamp-2">
              {data.description}
            </p>
          )}
          {data.fileSize && (
            <p className="text-xs text-on-surface-variant/60 mt-1">{data.fileSize}</p>
          )}
        </div>
        {data.file && (
          <a
            href={data.file}
            download
            className="flex-shrink-0 px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded transition hover:opacity-90"
          >
            Download
          </a>
        )}
      </div>
    </section>
  );
}
