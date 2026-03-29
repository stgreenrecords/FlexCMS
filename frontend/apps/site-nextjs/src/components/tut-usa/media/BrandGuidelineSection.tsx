export interface BrandGuidelineSectionData {
  title: string;
  body: string;
  examples: string[];
  downloads: string[];
}

const safeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');

export function BrandGuidelineSection({ data }: { data: BrandGuidelineSectionData }) {
  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-4">{data.title}</h2>
      )}

      {data.body && (
        <div
          className="text-on-surface-variant prose prose-invert max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: safeHtml(data.body) }}
        />
      )}

      {data.examples && data.examples.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
            Examples
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.examples.map((src, i) => (
              <div
                key={i}
                className="bg-surface-container-highest rounded-lg overflow-hidden aspect-video"
              >
                <img
                  src={src}
                  alt={`Example ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {data.downloads && data.downloads.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
            Downloads
          </h3>
          <div className="space-y-2">
            {data.downloads.map((file, i) => (
              <a
                key={i}
                href={file}
                download
                className="flex items-center gap-3 bg-surface-container-low rounded-lg p-3 hover:bg-surface-container-highest transition"
              >
                <span className="w-8 h-8 bg-surface-container-highest rounded flex items-center justify-center text-primary text-xs font-bold">
                  DL
                </span>
                <span className="text-on-surface text-sm truncate">{file}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
