export interface UgcItem {
  image: string;
  caption?: string;
  author?: string;
}

export interface UserGeneratedGalleryData {
  title: string;
  items: UgcItem[];
  submissionUrl: string;
  moderationStatus: string;
}

interface Props {
  data: UserGeneratedGalleryData;
}

export function UserGeneratedGallery({ data }: Props) {
  const { title, items, submissionUrl, moderationStatus } = data;

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {title && (
          <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
        )}
        <div className="flex items-center gap-3">
          {moderationStatus && (
            <span className="font-label uppercase text-xs tracking-widest text-secondary">
              {moderationStatus}
            </span>
          )}
          {submissionUrl && (
            <a
              href={submissionUrl}
              className="bg-primary text-on-primary font-label uppercase text-xs tracking-widest px-3 py-1.5 rounded hover:bg-primary-fixed transition-colors"
            >
              Submit Photo
            </a>
          )}
        </div>
      </div>
      {items && items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="aspect-square overflow-hidden rounded-lg border border-outline-variant/40">
                <img
                  src={item.image}
                  alt={item.caption ?? `Gallery item ${i + 1}`}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              {(item.caption || item.author) && (
                <div className="flex flex-col gap-0.5 px-0.5">
                  {item.caption && (
                    <span className="text-xs text-on-surface-variant leading-snug">{item.caption}</span>
                  )}
                  {item.author && (
                    <span className="font-label uppercase text-xs tracking-widest text-secondary">
                      by {item.author}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">No photos submitted yet.</p>
      )}
    </section>
  );
}
