export interface JobListingCardData {
  jobTitle: string;
  department: string;
  location: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  applyUrl: string;
}

interface Props {
  data: JobListingCardData;
}

export function JobListingCard({ data }: Props) {
  const { jobTitle, department, location, employmentType, applyUrl } = data;

  const typeLabel: Record<JobListingCardData['employmentType'], string> = {
    'full-time': 'Full-time',
    'part-time': 'Part-time',
    'contract': 'Contract',
    'internship': 'Internship',
  };

  return (
    <article className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <h3 className="font-headline text-base text-[var(--color-on-surface)] mb-1">{jobTitle}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-on-surface-variant)]">
          <span>{department}</span>
          <span>{location}</span>
          <span className="font-label text-xs text-[var(--color-primary)] border border-[var(--color-primary)] rounded-full px-2 py-0.5">
            {typeLabel[employmentType]}
          </span>
        </div>
      </div>
      <a
        href={applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-label text-sm bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded px-4 py-2 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
      >
        Apply
      </a>
    </article>
  );
}
