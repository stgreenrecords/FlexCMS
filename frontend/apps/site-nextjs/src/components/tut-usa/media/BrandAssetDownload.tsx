export interface BrandAssetDownloadData {
  title: string;
  assetFiles: string[];
  usageTerms: string;
  contact: string;
}

export function BrandAssetDownload({ data }: { data: BrandAssetDownloadData }) {
  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-6">{data.title}</h2>
      )}

      {data.assetFiles && data.assetFiles.length > 0 && (
        <div className="space-y-3 mb-6">
          {data.assetFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-surface-container-low rounded-lg p-4"
            >
              <div className="w-10 h-10 flex-shrink-0 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary text-xs font-bold">
                ZIP
              </div>
              <span className="flex-1 text-on-surface text-sm truncate">{file}</span>
              <a
                href={file}
                download
                className="flex-shrink-0 px-3 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded transition hover:opacity-90"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}

      {data.usageTerms && (
        <div className="bg-surface-container-low rounded-lg p-4 mb-4">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
            Usage Terms
          </p>
          <p className="text-sm text-on-surface-variant">{data.usageTerms}</p>
        </div>
      )}

      {data.contact && (
        <p className="text-sm text-on-surface-variant">
          Questions?{' '}
          <a href={`mailto:${data.contact}`} className="text-primary underline">
            {data.contact}
          </a>
        </p>
      )}
    </section>
  );
}
