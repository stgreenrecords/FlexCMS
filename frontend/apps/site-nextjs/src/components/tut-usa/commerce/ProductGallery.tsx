export interface ProductGalleryData {
  /** Gallery images — 960×720 each */
  images: string[];
  zoomEnabled: boolean;
  showThumbnails: boolean;
}

export function ProductGallery({ data }: { data: ProductGalleryData }) {
  const main = data.images?.[0];
  return (
    <div className="bg-surface-container-low p-6">
      {main && (
        <div className={`overflow-hidden mb-4 ${data.zoomEnabled ? 'cursor-zoom-in' : ''}`}>
          <img src={main} alt="" className="w-full object-cover" />
        </div>
      )}
      {data.showThumbnails && data.images && data.images.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {data.images.map((img, i) => (
            <div
              key={i}
              className={`w-16 h-16 overflow-hidden border ${i === 0 ? 'border-primary' : 'border-outline-variant/30'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
