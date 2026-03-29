export interface NewsCardData {
  headline: string;
  summary: string;
  /** News thumbnail — 400×300 */
  thumbnail: string;
  publishDate: string;
  cta: { label: string; url: string };
}

interface Props {
  data: NewsCardData;
}

export function NewsCard({ data }: Props) {
  const { headline, summary, thumbnail, publishDate, cta } = data;

  return (
    <article className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden flex flex-col">
      {thumbnail && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={thumbnail}
            alt={headline}
            width={400}
            height={300}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <div className="p-5 flex flex-col gap-2 flex-1">
        {publishDate && (
          <time
            dateTime={publishDate}
            className="font-label tracking-widest uppercase text-xs text-on-surface-variant"
          >
            {publishDate}
          </time>
        )}
        <h3 className="font-headline italic text-on-surface text-lg leading-snug">{headline}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed flex-1">{summary}</p>
        {cta?.url && (
          <a
            href={cta.url}
            className="font-label tracking-widest uppercase text-xs text-primary hover:underline self-start mt-2"
          >
            {cta.label}
          </a>
        )}
      </div>
    </article>
  );
}
