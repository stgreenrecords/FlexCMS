function safeHtml(raw: string): string {
  return raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

export interface TermsAndConditionsData {
  title: string;
  body: string;
  effectiveDate: string;
  version: string;
}

export function TermsAndConditions({ data }: { data: TermsAndConditionsData }) {
  return (
    <article className="px-12 py-20 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="font-headline italic text-4xl text-on-surface mb-4">{data.title}</h2>
        <div className="flex gap-8 text-secondary">
          {data.version && (
            <span className="font-label text-xs uppercase tracking-widest">
              Version: {data.version}
            </span>
          )}
          {data.effectiveDate && (
            <span className="font-label text-xs uppercase tracking-widest">
              Effective: {new Date(data.effectiveDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      {data.body && (
        <div
          className="prose prose-invert max-w-none font-body text-secondary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: safeHtml(data.body) }}
        />
      )}
    </article>
  );
}
