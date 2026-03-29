export interface XFeedData {
  title: string;
  handle: string;
  postCount: number;
  excludeReplies: boolean;
}

interface Props {
  data: XFeedData;
}

export function XFeed({ data }: Props) {
  const { title, handle, postCount, excludeReplies } = data;
  const count = Math.max(1, Math.min(postCount || 3, 10));

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {title && (
          <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
        )}
        <span className="font-label uppercase text-xs tracking-widest text-secondary">X / Twitter</span>
      </div>
      {handle && (
        <div className="flex items-center gap-2">
          <a
            href={`https://x.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            @{handle}
          </a>
          {excludeReplies && (
            <span className="font-label uppercase text-xs tracking-widest text-secondary">(no replies)</span>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container rounded-lg border border-outline-variant/40 p-4 flex flex-col gap-2 animate-pulse"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-outline-variant/40 flex-shrink-0" />
              <div className="h-3 rounded bg-outline-variant/40 w-32" />
            </div>
            <div className="h-3 rounded bg-outline-variant/40 w-full" />
            <div className="h-3 rounded bg-outline-variant/40 w-4/5" />
          </div>
        ))}
      </div>
    </section>
  );
}
