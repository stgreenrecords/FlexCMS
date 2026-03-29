export interface ProgramOverviewData {
  title: string;
  summary: string;
  duration: string;
  outcomes: string[];
  cta: { label: string; url: string };
}

interface Props {
  data: ProgramOverviewData;
}

export function ProgramOverview({ data }: Props) {
  const { title, summary, duration, outcomes, cta } = data;

  return (
    <section className="bg-surface-container border border-outline-variant rounded-2xl p-8 flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="font-headline text-3xl text-on-surface leading-tight">{title}</h2>
        <div className="flex items-center gap-2 text-sm text-secondary font-label">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{duration}</span>
        </div>
        <p className="text-base text-secondary leading-relaxed">{summary}</p>
      </div>

      {outcomes.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-label font-semibold text-sm text-secondary uppercase tracking-wider">
            Learning Outcomes
          </h3>
          <ul className="flex flex-col gap-3">
            {outcomes.map((outcome, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-on-surface">
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
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <a
          href={cta.url}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-label font-medium transition-opacity hover:opacity-90"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
          }}
        >
          {cta.label}
        </a>
      </div>
    </section>
  );
}
