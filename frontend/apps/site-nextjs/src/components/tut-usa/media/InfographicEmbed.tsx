export interface InfographicEmbedData {
  title: string;
  /** Infographic image — 1200×800 */
  image: string;
  /** Download file — 48×48 icon */
  downloadFile: string;
  altDescription: string;
}

export function InfographicEmbed({ data }: { data: InfographicEmbedData }) {
  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-4">{data.title}</h2>
      )}
      <div className="bg-surface-container-highest rounded-lg overflow-hidden">
        {data.image && (
          <img
            src={data.image}
            alt={data.altDescription || data.title}
            className="w-full object-contain"
            loading="lazy"
          />
        )}
      </div>
      {data.downloadFile && (
        <div className="flex items-center gap-3 mt-4 p-4 bg-surface-container-low rounded-lg">
          <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary text-xs font-bold uppercase">
            DL
          </div>
          <div className="flex-1">
            <p className="text-on-surface text-sm font-medium">Download Infographic</p>
          </div>
          <a
            href={data.downloadFile}
            download
            className="px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded transition hover:opacity-90"
          >
            Download
          </a>
        </div>
      )}
    </section>
  );
}
