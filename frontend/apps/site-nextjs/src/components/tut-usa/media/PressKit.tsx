export interface PressKitData {
  title: string;
  companyOverview: string;
  assets: string[];
  contact: string;
}

const safeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');

export function PressKit({ data }: { data: PressKitData }) {
  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-6">{data.title}</h2>
      )}

      {data.companyOverview && (
        <div
          className="text-on-surface-variant prose prose-invert max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: safeHtml(data.companyOverview) }}
        />
      )}

      {data.assets && data.assets.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
            Press Assets
          </h3>
          <div className="space-y-2">
            {data.assets.map((asset, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-surface-container-low rounded-lg p-4"
              >
                <div className="w-10 h-10 flex-shrink-0 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary text-xs font-bold">
                  DL
                </div>
                <span className="flex-1 text-on-surface text-sm truncate">{asset}</span>
                <a
                  href={asset}
                  download
                  className="flex-shrink-0 px-3 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded transition hover:opacity-90"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.contact && (
        <div className="bg-surface-container-low rounded-lg p-4">
          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-1">
            Media Contact
          </p>
          <a href={`mailto:${data.contact}`} className="text-primary text-sm underline">
            {data.contact}
          </a>
        </div>
      )}
    </section>
  );
}
