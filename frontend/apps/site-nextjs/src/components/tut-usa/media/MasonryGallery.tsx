export interface MasonryGalleryData {
  title: string;
  items: string[];
  columns: number;
  lightbox: boolean;
}

export function MasonryGallery({ data }: { data: MasonryGalleryData }) {
  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-6">{data.title}</h2>
      )}
      <div
        className="columns-1 gap-4"
        style={{ columnCount: data.columns || 3 }}
      >
        {data.items?.map((src, i) => (
          <div
            key={i}
            className="break-inside-avoid mb-4 bg-surface-container-highest rounded-lg overflow-hidden"
          >
            <img
              src={src}
              alt={`Gallery item ${i + 1}`}
              className="w-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      {data.lightbox && (
        <p className="text-xs text-on-surface-variant mt-3">
          Click an image to open lightbox.
        </p>
      )}
    </section>
  );
}
