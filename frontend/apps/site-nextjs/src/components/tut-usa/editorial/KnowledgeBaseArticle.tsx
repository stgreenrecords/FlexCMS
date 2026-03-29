export interface KnowledgeBaseArticleData {
  title: string;
  summary: string;
  body: string;
  category: string;
  relatedArticles: string[];
}

const safeHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '');

interface Props {
  data: KnowledgeBaseArticleData;
}

export function KnowledgeBaseArticle({ data }: Props) {
  const { title, summary, body, category, relatedArticles } = data;

  return (
    <article className="max-w-3xl mx-auto py-8">
      {category && (
        <span className="font-label tracking-widest uppercase text-xs text-primary mb-4 block">
          {category}
        </span>
      )}
      <h1 className="font-headline italic text-on-surface text-4xl mb-4">{title}</h1>
      {summary && (
        <p className="text-on-surface-variant text-lg leading-relaxed mb-8 border-b border-outline-variant/20 pb-6">
          {summary}
        </p>
      )}
      <div
        className="prose prose-invert max-w-none text-on-surface-variant leading-relaxed mb-8"
        dangerouslySetInnerHTML={{ __html: safeHtml(body) }}
      />
      {relatedArticles.length > 0 && (
        <aside className="border-t border-outline-variant/20 pt-6">
          <h2 className="font-label tracking-widest uppercase text-xs text-on-surface mb-4">
            Related Articles
          </h2>
          <ul className="flex flex-col gap-2">
            {relatedArticles.map((article, i) => (
              <li key={i} className="text-sm text-primary hover:underline">
                {article}
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
