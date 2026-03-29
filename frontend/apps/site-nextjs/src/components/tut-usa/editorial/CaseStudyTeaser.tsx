export interface CaseStudyTeaserData {
  title: string;
  summary: string;
  /** Case study thumbnail — 400×300 */
  thumbnail: string;
  industry: string;
  cta: { label: string; url: string };
}

interface Props {
  data: CaseStudyTeaserData;
}

export function CaseStudyTeaser({ data }: Props) {
  const { title, summary, thumbnail, industry, cta } = data;

  return (
    <article className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden flex flex-col">
      {thumbnail && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={thumbnail}
            alt={title}
            width={400}
            height={300}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          {industry && (
            <span className="absolute top-3 left-3 bg-surface/80 backdrop-blur-sm font-label tracking-widest uppercase text-xs text-primary px-2 py-1 rounded">
              {industry}
            </span>
          )}
        </div>
      )}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <h3 className="font-headline italic text-on-surface text-lg leading-snug">{title}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed flex-1">{summary}</p>
        {cta?.url && (
          <a
            href={cta.url}
            className="font-label tracking-widest uppercase text-xs text-primary hover:underline self-start mt-1"
          >
            {cta.label}
          </a>
        )}
      </div>
    </article>
  );
}
