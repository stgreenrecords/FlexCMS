export interface JobDetailData {
  jobTitle: string;
  location: string;
  description: string;
  requirements: string;
  applyUrl: string;
}

interface Props {
  data: JobDetailData;
}

export function JobDetail({ data }: Props) {
  const { jobTitle, location, description, requirements, applyUrl } = data;

  const safeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');

  return (
    <article className="bg-surface-container rounded-xl p-6 border border-outline-variant">
      <header className="mb-6">
        <h1 className="font-headline text-2xl text-[var(--color-on-surface)] mb-1">{jobTitle}</h1>
        <p className="text-sm text-[var(--color-on-surface-variant)]">{location}</p>
      </header>

      <section className="mb-6">
        <h2 className="font-headline text-lg text-[var(--color-on-surface)] mb-3">About the Role</h2>
        <div
          className="prose prose-sm text-[var(--color-on-surface)]"
          dangerouslySetInnerHTML={{ __html: safeHtml(description) }}
        />
      </section>

      <section className="mb-8">
        <h2 className="font-headline text-lg text-[var(--color-on-surface)] mb-3">Requirements</h2>
        <div
          className="prose prose-sm text-[var(--color-on-surface)]"
          dangerouslySetInnerHTML={{ __html: safeHtml(requirements) }}
        />
      </section>

      <a
        href={applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-label text-sm bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded px-6 py-2.5 inline-block hover:opacity-90 transition-opacity"
      >
        Apply for this Role
      </a>
    </article>
  );
}
