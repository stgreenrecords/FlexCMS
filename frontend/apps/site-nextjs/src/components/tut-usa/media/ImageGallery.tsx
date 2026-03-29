export interface ImageGalleryData {
  title: string;
  images: string[];
  layout: 'grid' | 'masonry' | 'strip';
  lightbox: boolean;
}

const layoutClass: Record<ImageGalleryData['layout'], string> = {
  grid: 'grid grid-cols-2 md:grid-cols-3 gap-4',
  masonry: 'columns-2 md:columns-3 gap-4',
  strip: 'flex gap-4 overflow-x-auto',
};

export function ImageGallery({ data }: { data: ImageGalleryData }) {
  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-6">{data.title}</h2>
      )}
      <div className={layoutClass[data.layout] || layoutClass.grid}>
        {data.images?.map((src, i) => (
          <div
            key={i}
            className="bg-surface-container-highest overflow-hidden rounded-lg aspect-video"
          >
            <img
              src={src}
              alt={`Gallery image ${i + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
