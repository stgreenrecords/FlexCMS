export interface ImageWithCaptionData {
  /** Image — 800×600 */
  image: string;
  caption: string;
  credit: string;
  altText: string;
}

export function ImageWithCaption({ data }: { data: ImageWithCaptionData }) {
  return (
    <figure className="py-8 bg-surface">
      <div className="bg-surface-container-highest rounded-lg overflow-hidden aspect-video">
        {data.image && (
          <img
            src={data.image}
            alt={data.altText || data.caption}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      {(data.caption || data.credit) && (
        <figcaption className="mt-3 flex justify-between items-start gap-4">
          {data.caption && (
            <p className="text-sm text-on-surface-variant">{data.caption}</p>
          )}
          {data.credit && (
            <p className="text-xs text-on-surface-variant/60 whitespace-nowrap">
              © {data.credit}
            </p>
          )}
        </figcaption>
      )}
    </figure>
  );
}
