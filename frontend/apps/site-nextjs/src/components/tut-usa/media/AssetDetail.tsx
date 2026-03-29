export interface AssetDetailData {
  title: string;
  description: string;
  /** File — 48×48 icon */
  file: string;
  usageRights: string;
  relatedAssets: string[];
}

export function AssetDetail({ data }: { data: AssetDetailData }) {
  return (
    <section className="py-10 bg-surface">
      <div className="bg-surface-container-low rounded-lg p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 flex-shrink-0 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary font-bold text-xs uppercase">
            ASSET
          </div>
          <div className="flex-1">
            {data.title && (
              <h2 className="text-xl font-semibold text-on-surface mb-1">{data.title}</h2>
            )}
            {data.description && (
              <p className="text-on-surface-variant text-sm">{data.description}</p>
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

        {data.usageRights && (
          <div className="border-t border-surface-container-highest pt-4 mb-4">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">
              Usage Rights
            </p>
            <p className="text-sm text-on-surface-variant">{data.usageRights}</p>
          </div>
        )}

        {data.relatedAssets && data.relatedAssets.length > 0 && (
          <div className="border-t border-surface-container-highest pt-4">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
              Related Assets
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.relatedAssets.map((asset, i) => (
                <a
                  key={i}
                  href={asset}
                  className="block bg-surface-container-highest rounded-lg p-3 text-on-surface-variant text-xs hover:text-on-surface transition truncate"
                >
                  {asset}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
