const safeHtml = (raw: string): string =>
  raw.replace(/<script[\s\S]*?<\/script>/gi, '');

export interface ChampionStoryData {
  title: string;
  story: string;
  person: string;
  cta: { label: string; url: string };
}

interface Props {
  data: ChampionStoryData;
}

export function ChampionStory({ data }: Props) {
  const { title, story, person, cta } = data;

  return (
    <article className="bg-surface-container rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      <span className="font-label uppercase text-xs tracking-widest text-secondary">Champion Story</span>
      {title && (
        <h2 className="font-headline italic text-on-surface text-2xl leading-snug">{title}</h2>
      )}
      {story && (
        <div
          className="font-body text-sm text-on-surface-variant leading-relaxed prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: safeHtml(story) }}
        />
      )}
      {person && (
        <p className="font-label uppercase text-xs tracking-widest text-secondary border-t border-outline-variant/40 pt-3">
          {person}
        </p>
      )}
      {cta?.url && (
        <a
          href={cta.url}
          className="self-start bg-primary text-on-primary font-label uppercase text-xs tracking-widest px-5 py-2.5 rounded hover:bg-primary-fixed transition-colors"
        >
          {cta.label}
        </a>
      )}
    </article>
  );
}
