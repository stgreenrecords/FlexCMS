export interface CourseCardData {
  courseTitle: string;
  summary: string;
  duration: string;
  level: string;
  cta: { label: string; url: string };
}

interface Props {
  data: CourseCardData;
}

export function CourseCard({ data }: Props) {
  const { courseTitle, summary, duration, level, cta } = data;

  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-headline text-xl text-on-surface leading-snug">{courseTitle}</h3>
        <span className="shrink-0 text-xs font-label px-3 py-1 rounded-full bg-surface-container border border-outline-variant text-secondary">
          {level}
        </span>
      </div>

      <p className="text-sm text-secondary leading-relaxed flex-1">{summary}</p>

      <div className="flex items-center gap-2 text-xs text-secondary font-label">
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
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{duration}</span>
      </div>

      <a
        href={cta.url}
        className="mt-auto inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-label font-medium text-primary border border-primary hover:bg-surface-container transition-colors"
      >
        {cta.label}
      </a>
    </div>
  );
}
