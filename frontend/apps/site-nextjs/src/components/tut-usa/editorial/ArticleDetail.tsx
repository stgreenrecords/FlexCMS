export interface ArticleDetailData {
  headline: string;
  subtitle: string;
  /** Article hero — 1920×1080 */
  heroImage: string;
  body: string;
  author: string;
  publishDate: string;
}

const safeHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '');

interface Props {
  data: ArticleDetailData;
}

export function ArticleDetail({ data }: Props) {
  const { headline, subtitle, heroImage, body, author, publishDate } = data;

  return (
    <article>
      {heroImage && (
        <div className="relative w-full aspect-video overflow-hidden mb-8">
          <img
            src={heroImage}
            alt={headline}
            width={1920}
            height={1080}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="font-headline italic text-on-surface text-4xl md:text-5xl mb-4 leading-tight">
            {headline}
          </h1>
          {subtitle && (
            <p className="text-on-surface-variant text-xl leading-relaxed mb-6">{subtitle}</p>
          )}
          <div className="flex items-center gap-4 text-xs font-label tracking-widest uppercase text-on-surface-variant border-t border-outline-variant/20 pt-4">
            {author && <span>{author}</span>}
            {author && publishDate && <span aria-hidden="true">·</span>}
            {publishDate && <time dateTime={publishDate}>{publishDate}</time>}
          </div>
        </header>
        <div
          className="prose prose-invert max-w-none text-on-surface-variant leading-relaxed"
          dangerouslySetInnerHTML={{ __html: safeHtml(body) }}
        />
      </div>
    </article>
  );
}
