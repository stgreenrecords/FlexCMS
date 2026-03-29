interface CtaData { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function CategoryCard({ data }: Props) {
  const title = (data.title as string) ?? '';
  const description = (data.description as string) ?? '';
  const image = (data.image as string) ?? '';
  const cta = (data.cta as CtaData | undefined) ?? null;

  return (
    <div className="group bg-neutral-950 border border-neutral-800 hover:border-neutral-600 transition-colors duration-300 overflow-hidden">
      {image && (
        <div className="aspect-video overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-6">
        {title && (
          <h3 className="text-base font-light text-white tracking-wider uppercase mb-2">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-neutral-400 mb-4 leading-relaxed">{description}</p>
        )}
        {cta && (
          <a
            href={cta.url}
            className="inline-block text-xs text-white border-b border-white pb-px uppercase tracking-widest hover:border-neutral-400 hover:text-neutral-400 transition-colors duration-200"
          >
            {cta.label} &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
