/** tut/card — editorial card with image, title, description and optional CTA. */
export function Card({ data }: { data: Record<string, unknown> }) {
  const image = data.image as string | undefined;
  const title = data.title as string | undefined;
  const description = data.description as string | undefined;
  const ctaLabel = data.ctaLabel as string | undefined;
  const ctaLink = data.ctaLink as string | undefined;

  return (
    <article className="flex flex-col bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 group">
      {image && (
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={image}
            alt={title ?? ''}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex flex-col flex-1 p-6 gap-3">
        {title && (
          <h3 className="text-xl font-bold text-gray-900 leading-snug">{title}</h3>
        )}
        {description && (
          <p className="text-gray-600 text-sm leading-relaxed flex-1">{description}</p>
        )}
        {ctaLabel && ctaLink && (
          <a
            href={ctaLink}
            className="mt-2 self-start text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-900 pb-0.5 hover:opacity-60 transition-opacity"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </article>
  );
}
