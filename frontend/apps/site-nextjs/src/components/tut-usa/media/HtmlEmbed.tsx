export interface HtmlEmbedData {
  title: string;
  html: string;
  sandboxMode: boolean;
  consentCategory: 'analytics' | 'marketing' | 'functional' | 'essential';
}

const safeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');

export function HtmlEmbed({ data }: { data: HtmlEmbedData }) {
  return (
    <section className="py-8">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-4">{data.title}</h2>
      )}
      {data.sandboxMode ? (
        <iframe
          srcDoc={safeHtml(data.html)}
          sandbox="allow-scripts allow-same-origin"
          className="w-full min-h-64 border-0 bg-surface-container-low"
          title={data.title}
          loading="lazy"
        />
      ) : (
        <div
          className="text-on-surface"
          dangerouslySetInnerHTML={{ __html: safeHtml(data.html) }}
        />
      )}
      <p className="text-xs text-on-surface-variant mt-2">
        Consent category: {data.consentCategory}
      </p>
    </section>
  );
}
