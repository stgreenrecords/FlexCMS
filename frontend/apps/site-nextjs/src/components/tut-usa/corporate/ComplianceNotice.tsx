export interface ComplianceNoticeData {
  title: string;
  body: string;
  effectiveDate: string;
  region: string;
}

interface Props {
  data: ComplianceNoticeData;
}

export function ComplianceNotice({ data }: Props) {
  const { title, body, effectiveDate, region } = data;

  const safeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');

  return (
    <section className="bg-surface-container rounded-xl p-6 border border-outline-variant">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <h2 className="font-headline text-xl text-[var(--color-on-surface)]">{title}</h2>
        <span className="font-label text-xs text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-high)] rounded px-2 py-1">
          {region}
        </span>
      </div>
      <div
        className="prose prose-sm text-[var(--color-on-surface)] mb-4"
        dangerouslySetInnerHTML={{ __html: safeHtml(body) }}
      />
      <p className="text-sm text-[var(--color-on-surface-variant)]">
        Effective:{' '}
        <time dateTime={effectiveDate}>{effectiveDate}</time>
      </p>
    </section>
  );
}
