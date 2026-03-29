export interface SocialFeedData {
  title: string;
  sourceHandle: string;
  network: string;
  postCount: number;
}

interface Props {
  data: SocialFeedData;
}

export function SocialFeed({ data }: Props) {
  const { title, sourceHandle, network, postCount } = data;
  const count = Math.max(1, Math.min(postCount || 3, 12));

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {title && (
          <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
        )}
        {network && (
          <span className="font-label uppercase text-xs tracking-widest text-secondary">{network}</span>
        )}
      </div>
      {sourceHandle && (
        <p className="text-sm text-on-surface-variant">
          Loading from{' '}
          <span className="text-primary font-medium">@{sourceHandle}</span>
          …
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg bg-surface-container border border-outline-variant/40 animate-pulse"
          />
        ))}
      </div>
    </section>
  );
}
