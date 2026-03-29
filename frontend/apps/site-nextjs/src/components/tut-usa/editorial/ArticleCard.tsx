export interface ArticleCardData {
  title: string;
  excerpt: string;
  /** Article image — 400×300 */
  image: string;
  author: string;
  publishDate: string;
}

interface Props {
  data: ArticleCardData;
}

export function ArticleCard({ data }: Props) {
  const { title, excerpt, image, author, publishDate } = data;

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
        </div>
      )}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-headline italic text-on-surface text-lg leading-snug">{title}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed flex-1">{excerpt}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant font-label tracking-widest uppercase">
          {author && <span>{author}</span>}
          {author && publishDate && <span aria-hidden="true">·</span>}
          {publishDate && (
            <time dateTime={publishDate}>{publishDate}</time>
          )}
        </div>
      </div>
    </article>
  );
}
