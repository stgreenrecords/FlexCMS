export interface GrantOpportunityData {
  title: string;
  summary: string;
  eligibility: string;
  deadlineDate: string;
  applyUrl: string;
}

interface Props {
  data: GrantOpportunityData;
}

export function GrantOpportunity({ data }: Props) {
  const { title, summary, eligibility, deadlineDate, applyUrl } = data;

  return (
    <article className="bg-surface-container rounded-xl p-6 border border-outline-variant">
      <h2 className="font-headline text-xl text-[var(--color-on-surface)] mb-2">{title}</h2>
      <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed mb-4 whitespace-pre-line">
        {summary}
      </p>
      <dl className="flex flex-col gap-2 mb-5 text-sm">
        <div className="flex gap-2">
          <dt className="font-label text-[var(--color-on-surface-variant)] shrink-0">Eligibility:</dt>
          <dd className="text-[var(--color-on-surface)]">{eligibility}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-label text-[var(--color-on-surface-variant)] shrink-0">Deadline:</dt>
          <dd>
            <time className="text-[var(--color-on-surface)]" dateTime={deadlineDate}>
              {deadlineDate}
            </time>
          </dd>
        </div>
      </dl>
      <a
        href={applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-label text-sm bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded px-5 py-2 inline-block hover:opacity-90 transition-opacity"
      >
        Apply Now
      </a>
    </article>
  );
}
