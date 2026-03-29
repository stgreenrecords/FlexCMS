export interface StoryCardData {
  title: string;
  excerpt: string;
  /** Story image — 400×300 */
  image: string;
  category: string;
  cta: { label: string; url: string };
}

interface Props {
  data: StoryCardData;
}

export function StoryCard({ data }: Props) {
  const { title, excerpt, image, category, cta } = data;

  return (
    <article className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden flex flex-col">
      {image && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={image}
            alt={title}
            width={400}
            height={300}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          {category && (
            <span className="absolute top-3 left-3 bg-surface/80 backdrop-blur-sm font-label tracking-widest uppercase text-xs text-primary px-2 py-1 rounded">
              {category}
            </span>
          )}
        </div>
      )}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-headline italic text-on-surface text-lg leading-snug">{title}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed flex-1">{excerpt}</p>
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
