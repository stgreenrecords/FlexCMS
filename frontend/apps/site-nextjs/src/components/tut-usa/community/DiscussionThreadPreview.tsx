export interface DiscussionThread {
  title: string;
  author: string;
  replies?: number;
  url: string;
}

export interface DiscussionThreadPreviewData {
  title: string;
  threads: DiscussionThread[];
  showReplyCount: boolean;
}

interface Props {
  data: DiscussionThreadPreviewData;
}

export function DiscussionThreadPreview({ data }: Props) {
  const { title, threads, showReplyCount } = data;

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      {title && (
        <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
      )}
      {threads && threads.length > 0 ? (
        <ul className="flex flex-col divide-y divide-outline-variant/40 list-none p-0">
          {threads.map((thread, i) => (
            <li key={i} className="flex items-center justify-between gap-4 py-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <a
                  href={thread.url}
                  className="font-body text-on-surface text-sm font-medium hover:text-primary transition-colors truncate"
                >
                  {thread.title}
                </a>
                <span className="font-label uppercase text-xs tracking-widest text-secondary">
                  by {thread.author}
                </span>
              </div>
              {showReplyCount && thread.replies !== undefined && (
                <span className="font-label uppercase text-xs tracking-widest text-on-surface-variant flex-shrink-0">
                  {thread.replies} {thread.replies === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-on-surface-variant">No threads to display.</p>
      )}
    </section>
  );
}
