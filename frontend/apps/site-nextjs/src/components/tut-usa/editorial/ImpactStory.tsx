export interface ImpactStoryData {
  title: string;
  body: string;
  /** Media — 800×500 */
  media: string;
  cta: { label: string; url: string };
}

const safeHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '');

interface Props {
  data: ImpactStoryData;
}

export function ImpactStory({ data }: Props) {
  const { title, body, media, cta } = data;

  return (
    <article className="grid md:grid-cols-2 gap-8 items-center py-8">
      {media && (
        <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '800/500' }}>
          <img
            src={media}
            alt={title}
            width={800}
            height={500}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-col gap-4">
        <h2 className="font-headline italic text-on-surface text-3xl leading-snug">{title}</h2>
        <div
          className="prose prose-invert max-w-none text-on-surface-variant text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: safeHtml(body) }}
        />
        {cta?.url && (
          <a
            href={cta.url}
            className="font-label tracking-widest uppercase text-xs text-primary hover:underline self-start"
          >
            {cta.label}
          </a>
        )}
      </div>
    </article>
  );
}
