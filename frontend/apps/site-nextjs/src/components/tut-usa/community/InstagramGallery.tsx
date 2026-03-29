export interface InstagramGalleryData {
  title: string;
  feedSource: string;
  postCount: number;
  linkToPost: boolean;
}

interface Props {
  data: InstagramGalleryData;
}

export function InstagramGallery({ data }: Props) {
  const { title, feedSource, postCount, linkToPost } = data;
  const count = Math.max(1, Math.min(postCount || 6, 18));

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {title && (
          <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
        )}
        {feedSource && (
          <span className="font-label uppercase text-xs tracking-widest text-secondary">
            @{feedSource}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {Array.from({ length: count }).map((_, i) => {
          const tile = (
            <div className="aspect-square rounded bg-surface-container border border-outline-variant/40 animate-pulse" />
          );
          return (
            <div key={i} className="overflow-hidden rounded">
              {linkToPost ? (
                <a href="#" aria-label={`Instagram post ${i + 1}`} className="block hover:opacity-80 transition-opacity">
                  {tile}
                </a>
              ) : tile}
            </div>
          );
        })}
      </div>
    </section>
  );
}
