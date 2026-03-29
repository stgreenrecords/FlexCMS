export interface LinkedInFeedData {
  title: string;
  companyPage: string;
  postCount: number;
}

interface Props {
  data: LinkedInFeedData;
}

export function LinkedInFeed({ data }: Props) {
  const { title, companyPage, postCount } = data;
  const count = Math.max(1, Math.min(postCount || 3, 10));

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {title && (
          <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
        )}
        <span className="font-label uppercase text-xs tracking-widest text-secondary">LinkedIn</span>
      </div>
      {companyPage && (
        <p className="text-sm text-on-surface-variant">
          Posts from{' '}
          <a
            href={`https://www.linkedin.com/company/${companyPage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {companyPage}
          </a>
        </p>
      )}
      <div className="flex flex-col gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container rounded-lg border border-outline-variant/40 p-4 flex flex-col gap-2 animate-pulse"
          >
            <div className="h-3 rounded bg-outline-variant/40 w-3/4" />
            <div className="h-3 rounded bg-outline-variant/40 w-full" />
            <div className="h-3 rounded bg-outline-variant/40 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}
