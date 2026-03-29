function safeHtml(raw: string): string {
  return (raw ?? '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

export interface ReturnsPolicyData {
  title: string;
  body: string;
  effectiveDate: string;
  contact: string;
}

export function ReturnsPolicy({ data }: { data: ReturnsPolicyData }) {
  return (
    <section className="bg-surface-container p-10 max-w-3xl">
      <h2 className="font-headline italic text-3xl text-on-surface mb-4">{data.title}</h2>
      {data.effectiveDate && (
        <p className="font-label uppercase text-xs tracking-widest text-secondary mb-8">Effective: {data.effectiveDate}</p>
      )}
      {data.body && (
        <div
          className="prose prose-sm prose-invert max-w-none font-body text-secondary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: safeHtml(data.body) }}
        />
      )}
      {data.contact && (
        <div className="mt-8 border-t border-outline-variant/20 pt-6">
          <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-2">Questions?</span>
          <a href={data.contact} className="font-body text-sm text-primary hover:underline">{data.contact}</a>
        </div>
      )}
    </section>
  );
}
