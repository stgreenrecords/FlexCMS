export interface ForumStat {
  label: string;
  value: string;
}

export interface CommunityForumTeaserData {
  title: string;
  description: string;
  cta: { label: string; url: string };
  stats: ForumStat[];
}

interface Props {
  data: CommunityForumTeaserData;
}

export function CommunityForumTeaser({ data }: Props) {
  const { title, description, cta, stats } = data;

  return (
    <section className="bg-surface-container rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {title && (
          <h2 className="font-headline italic text-on-surface text-2xl">{title}</h2>
        )}
        {description && (
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">{description}</p>
        )}
      </div>
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-surface-container-low rounded-lg border border-outline-variant/40 p-4 flex flex-col items-center gap-1 text-center"
            >
              <span className="font-headline italic text-on-surface text-2xl">{stat.value}</span>
              <span className="font-label uppercase text-xs tracking-widest text-secondary">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
      {cta?.url && (
        <a
          href={cta.url}
          className="self-start bg-primary text-on-primary font-label uppercase text-xs tracking-widest px-5 py-2.5 rounded hover:bg-primary-fixed transition-colors"
        >
          {cta.label}
        </a>
      )}
    </section>
  );
}
