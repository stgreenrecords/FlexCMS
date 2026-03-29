export interface ApiDocumentationTeaserData {
  title: string;
  description: string;
  cta: { label: string; url: string };
  tags: string[];
}

interface Props {
  data: ApiDocumentationTeaserData;
}

export function ApiDocumentationTeaser({ data }: Props) {
  const { title, description, cta, tags } = data;

  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div
          className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-secondary-container)' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-secondary"
            aria-hidden="true"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-headline text-lg text-on-surface">{title}</h3>
          <p className="text-sm text-secondary leading-relaxed">{description}</p>
        </div>
      </div>

      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="text-xs px-3 py-1 rounded-full border border-outline-variant text-secondary font-label"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <a
        href={cta.url}
        className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-label font-medium text-primary border border-primary hover:bg-surface-container transition-colors"
      >
        {cta.label}
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
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </a>
    </div>
  );
}
