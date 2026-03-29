export interface CommentsData {
  title: string;
  commentsSource: string;
  moderationEnabled: boolean;
  sortOrder: string;
}

interface Props {
  data: CommentsData;
}

export function Comments({ data }: Props) {
  const { title, commentsSource, moderationEnabled, sortOrder } = data;

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        {title && (
          <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
        )}
        <div className="flex items-center gap-3">
          {moderationEnabled && (
            <span className="font-label uppercase text-xs tracking-widest text-secondary bg-surface-container px-2 py-1 rounded border border-outline-variant/40">
              Moderated
            </span>
          )}
          {sortOrder && (
            <span className="font-label uppercase text-xs tracking-widest text-secondary">
              Sort: {sortOrder}
            </span>
          )}
        </div>
      </div>
      {/* New comment form */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-3 bg-surface-container rounded-lg border border-outline-variant/40 p-4"
      >
        <span className="font-label uppercase text-xs tracking-widest text-secondary">Leave a comment</span>
        <textarea
          rows={3}
          placeholder="Write your comment…"
          className="w-full bg-surface-container-low border border-outline-variant/40 rounded px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant resize-none focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="self-end bg-primary text-on-primary font-label uppercase text-xs tracking-widest px-4 py-2 rounded hover:bg-primary-fixed transition-colors"
        >
          Post Comment
        </button>
      </form>
      {/* Placeholder comment list */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="bg-surface-container rounded-lg border border-outline-variant/40 p-4 flex flex-col gap-2 animate-pulse"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-outline-variant/40 flex-shrink-0" />
              <div className="h-3 rounded bg-outline-variant/40 w-28" />
            </div>
            <div className="h-3 rounded bg-outline-variant/40 w-full" />
            <div className="h-3 rounded bg-outline-variant/40 w-3/4" />
          </div>
        ))}
        {commentsSource && (
          <p className="text-xs text-on-surface-variant text-center mt-2">
            Comments powered by {commentsSource}
          </p>
        )}
      </div>
    </section>
  );
}
