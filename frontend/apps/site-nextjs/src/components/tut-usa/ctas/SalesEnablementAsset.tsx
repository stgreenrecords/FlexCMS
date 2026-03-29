export interface SalesEnablementAssetData {
  title: string;
  description: string;
  /** Sales asset file */
  assetFile: string;
  salesStage: string;
  persona: string;
}

export function SalesEnablementAsset({ data }: { data: SalesEnablementAssetData }) {
  return (
    <div className="border border-outline-variant/30 p-6 bg-surface-container flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {data.salesStage && (
          <span className="font-label text-xs bg-surface-variant text-on-surface px-3 py-1 uppercase tracking-widest">
            {data.salesStage}
          </span>
        )}
        {data.persona && (
          <span className="font-label text-xs bg-surface-container-high text-secondary px-3 py-1 uppercase tracking-widest">
            {data.persona}
          </span>
        )}
      </div>
      <h3 className="font-headline italic text-xl text-on-surface">{data.title}</h3>
      {data.description && (
        <p className="font-body text-sm text-secondary">{data.description}</p>
      )}
      {data.assetFile && (
        <a
          href={data.assetFile}
          download
          className="inline-flex items-center gap-2 font-label text-xs font-bold uppercase tracking-widest text-primary border-b border-primary hover:text-on-surface transition-colors self-start"
        >
          <span>↓</span> Download Asset
        </a>
      )}
    </div>
  );
}
