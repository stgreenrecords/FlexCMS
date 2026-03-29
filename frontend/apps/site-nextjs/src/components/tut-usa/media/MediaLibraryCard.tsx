export interface MediaLibraryCardData {
  title: string;
  /** Thumbnail — 300×200 */
  thumbnail: string;
  assetType: 'image' | 'video' | 'document' | 'audio';
  lastModified: string;
}

const assetTypeLabel: Record<MediaLibraryCardData['assetType'], string> = {
  image: 'IMG',
  video: 'VID',
  document: 'DOC',
  audio: 'AUD',
};

export function MediaLibraryCard({ data }: { data: MediaLibraryCardData }) {
  return (
    <article className="bg-surface-container-low rounded-lg overflow-hidden hover:bg-surface-container-highest transition group">
      <div className="aspect-video bg-surface-container-highest relative overflow-hidden">
        {data.thumbnail ? (
          <img
            src={data.thumbnail}
            alt={data.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-2xl font-bold">
            {assetTypeLabel[data.assetType] || 'FILE'}
          </div>
        )}
        <span className="absolute top-2 left-2 bg-black/60 text-primary text-xs font-bold px-2 py-0.5 rounded uppercase">
          {assetTypeLabel[data.assetType]}
        </span>
      </div>
      <div className="p-3">
        {data.title && (
          <h3 className="text-on-surface text-sm font-medium truncate">{data.title}</h3>
        )}
        {data.lastModified && (
          <p className="text-on-surface-variant text-xs mt-0.5">{data.lastModified}</p>
        )}
      </div>
    </article>
  );
}
