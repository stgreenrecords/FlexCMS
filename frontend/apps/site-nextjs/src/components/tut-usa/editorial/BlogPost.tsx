export interface BlogPostData {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  /** Featured image — 1200×630 */
  featuredImage: string;
  tags: string[];
}

const safeHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '');

interface Props {
  data: BlogPostData;
}

export function BlogPost({ data }: Props) {
  const { title, slug: _slug, excerpt, body, featuredImage, tags } = data;

  return (
    <article>
      {featuredImage && (
        <div className="relative w-full overflow-hidden mb-8" style={{ aspectRatio: '1200/630' }}>
          <img
            src={featuredImage}
            alt={title}
            width={1200}
            height={630}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="font-headline italic text-on-surface text-4xl md:text-5xl mb-4 leading-tight">
          {title}
        </h1>
        {excerpt && (
          <p className="text-on-surface-variant text-lg leading-relaxed mb-8 border-b border-outline-variant/20 pb-6">
            {excerpt}
          </p>
        )}
        <div
          className="prose prose-invert max-w-none text-on-surface-variant leading-relaxed mb-8"
          dangerouslySetInnerHTML={{ __html: safeHtml(body) }}
        />
        {tags.length > 0 && (
          <footer className="border-t border-outline-variant/20 pt-6 flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs font-label tracking-widest uppercase text-on-surface-variant border border-outline-variant/30 rounded px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </footer>
        )}
      </div>
    </article>
  );
}
