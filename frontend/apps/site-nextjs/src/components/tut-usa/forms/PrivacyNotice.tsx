function safeHtml(raw: string): string {
  return raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

export interface PrivacyNoticeData {
  title: string;
  body: string;
  lastUpdated: string;
  owner: string;
}

export function PrivacyNotice({ data }: { data: PrivacyNoticeData }) {
  return (
    <article className="px-12 py-20 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="font-headline italic text-4xl text-on-surface mb-4">{data.title}</h2>
        <div className="flex gap-8 text-secondary">
          {data.lastUpdated && (
            <span className="font-label text-xs uppercase tracking-widest">
              Updated: {new Date(data.lastUpdated).toLocaleDateString()}
            </span>
          )}
          {data.owner && (
            <span className="font-label text-xs uppercase tracking-widest">
              Owner: {data.owner}
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
