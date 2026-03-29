function safeHtml(raw: string): string {
  return raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

export interface AccessibilityStatementData {
  title: string;
  body: string;
  contact: string;
  lastUpdated: string;
}

export function AccessibilityStatement({ data }: { data: AccessibilityStatementData }) {
  return (
    <article className="px-12 py-20 max-w-4xl mx-auto">
      <h2 className="font-headline italic text-4xl text-on-surface mb-4">{data.title}</h2>
      <div className="flex gap-8 mb-8 text-secondary">
        {data.lastUpdated && (
          <span className="font-label text-xs uppercase tracking-widest">
            Updated: {new Date(data.lastUpdated).toLocaleDateString()}
          </span>
        )}
      </div>
      {data.body && (
        <div
          className="prose prose-invert max-w-none font-body text-secondary leading-relaxed mb-8"
          dangerouslySetInnerHTML={{ __html: safeHtml(data.body) }}
        />
      )}
      {data.contact && (
        <div className="border-t border-outline-variant/20 pt-8">
          <p className="font-label text-xs uppercase tracking-widest text-secondary">
            Contact:{' '}
            <a href={`mailto:${data.contact}`} className="text-primary hover:underline">
              {data.contact}
            </a>
          </p>
        </div>
      )}
    </article>
  );
}
