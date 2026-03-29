export interface CsrHighlightData {
  title: string;
  summary: string;
  /** Image — 800×500 */
  image: string;
  cta: { label: string; url: string };
}

interface Props {
  data: CsrHighlightData;
}

export function CsrHighlight({ data }: Props) {
  const { title, summary, image, cta } = data;

  return (
    <article className="relative bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden">
      {image && (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '800/500' }}>
          <img
            src={image}
            alt={title}
            width={800}
            height={500}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent" />
        </div>
      )}
      <div className="p-6">
        <h3 className="font-headline italic text-on-surface text-2xl mb-3">{title}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{summary}</p>
        {cta?.url && (
          <a
            href={cta.url}
            className="font-label tracking-widest uppercase text-xs text-primary hover:underline"
          >
            {cta.label}
          </a>
        )}
      </div>
    </article>
  );
}
