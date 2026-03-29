export interface PolicyDocumentData {
  title: string;
  body: string;
  owner: string;
  reviewDate: string;
  version: string;
}

interface Props {
  data: PolicyDocumentData;
}

export function PolicyDocument({ data }: Props) {
  const { title, body, owner, reviewDate, version } = data;

  const safeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');

  return (
    <article className="bg-surface-container rounded-xl p-6 border border-outline-variant">
      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="font-headline text-2xl text-[var(--color-on-surface)]">{title}</h1>
          <span className="font-label text-xs text-[var(--color-primary)] border border-[var(--color-primary)] rounded px-2 py-0.5">
            v{version}
          </span>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--color-on-surface-variant)]">
          <div className="flex gap-1">
            <dt className="font-label">Owner:</dt>
            <dd>{owner}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-label">Review date:</dt>
            <dd><time dateTime={reviewDate}>{reviewDate}</time></dd>
          </div>
        </dl>
      </header>
      <div
        className="prose prose-sm text-[var(--color-on-surface)]"
        dangerouslySetInnerHTML={{ __html: safeHtml(body) }}
      />
    </article>
  );
}
