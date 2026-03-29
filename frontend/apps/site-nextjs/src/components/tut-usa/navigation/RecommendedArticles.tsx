interface Props { data: Record<string, unknown> }

export function RecommendedArticles({ data }: Props) {
  const title = (data.title as string) ?? 'Recommended Articles';
  const articles = (data.articles as string[]) ?? [];

  return (
    <section className="py-8">
      <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-5">
        {title}
      </h3>
      {articles.length > 0 ? (
        <ul className="flex flex-col gap-4 list-none m-0 p-0">
          {articles.map((article, i) => (
            <li
              key={i}
              className="text-sm text-neutral-300 py-3 border-b border-neutral-800 last:border-b-0"
            >
              {article}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-600">No articles to display.</p>
      )}
    </section>
  );
}
