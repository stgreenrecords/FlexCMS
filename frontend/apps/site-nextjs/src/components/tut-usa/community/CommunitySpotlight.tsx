const safeHtml = (raw: string): string =>
  raw.replace(/<script[\s\S]*?<\/script>/gi, '');

export interface CommunitySpotlightData {
  title: string;
  story: string;
  /** Photo — 400×400 */
  photo: string;
  cta: { label: string; url: string };
}

interface Props {
  data: CommunitySpotlightData;
}

export function CommunitySpotlight({ data }: Props) {
  const { title, story, photo, cta } = data;

  return (
    <article className="bg-surface-container rounded-xl border border-outline-variant/40 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {photo && (
          <div className="md:w-64 flex-shrink-0">
            <img
              src={photo}
              alt={title}
              width={400}
              height={400}
              className="w-full h-full object-cover aspect-square md:aspect-auto"
            />
          </div>
        )}
        <div className="p-6 flex flex-col gap-4 flex-1">
          <span className="font-label uppercase text-xs tracking-widest text-secondary">
            Community Spotlight
          </span>
          {title && (
            <h2 className="font-headline italic text-on-surface text-2xl leading-snug">{title}</h2>
          )}
          {story && (
            <div
              className="font-body text-sm text-on-surface-variant leading-relaxed prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: safeHtml(story) }}
            />
          )}
          {cta?.url && (
            <a
              href={cta.url}
              className="self-start bg-primary text-on-primary font-label uppercase text-xs tracking-widest px-5 py-2.5 rounded hover:bg-primary-fixed transition-colors mt-2"
            >
              {cta.label}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
