export interface IntegrationDetailData {
  title: string;
  summary: string;
  /** Logo — 120×40 */
  logo: string;
  supportedFeatures: string[];
  documentationUrl: string;
}

interface Props {
  data: IntegrationDetailData;
}

export function IntegrationDetail({ data }: Props) {
  const { title, summary, logo, supportedFeatures, documentationUrl } = data;

  return (
    <section className="bg-surface-container border border-outline-variant rounded-2xl p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="shrink-0">
          <img
            src={logo}
            alt={`${title} logo`}
            width={120}
            height={40}
            className="object-contain"
          />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-headline text-2xl text-on-surface">{title}</h2>
          <p className="text-sm text-secondary leading-relaxed">{summary}</p>
        </div>
      </div>

      {/* Supported Features */}
      {supportedFeatures.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-label font-semibold text-sm text-secondary uppercase tracking-wider">
            Supported Features
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {supportedFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-on-surface">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 mt-0.5 text-primary"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Documentation Link */}
      {documentationUrl && (
        <div className="border-t border-outline-variant pt-6">
          <a
            href={documentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-label font-medium text-primary border border-primary hover:bg-surface-container transition-colors"
          >
            View Documentation
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      )}
    </section>
  );
}
