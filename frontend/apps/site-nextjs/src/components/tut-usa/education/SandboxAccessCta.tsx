export interface SandboxAccessCtaData {
  title: string;
  description: string;
  cta: { label: string; url: string };
  eligibilityNote: string;
}

interface Props {
  data: SandboxAccessCtaData;
}

export function SandboxAccessCta({ data }: Props) {
  const { title, description, cta, eligibilityNote } = data;

  return (
    <div
      className="rounded-2xl p-8 flex flex-col gap-6"
      style={{
        backgroundColor: 'var(--color-primary-container)',
        color: 'var(--color-on-primary-container)',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-headline text-2xl">{title}</h2>
          <p className="text-sm leading-relaxed opacity-80">{description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={cta.url}
          className="self-start inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-label font-medium transition-opacity hover:opacity-90"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
          }}
        >
          {cta.label}
        </a>

        {eligibilityNote && (
          <p className="text-xs opacity-60 font-label">{eligibilityNote}</p>
        )}
      </div>
    </div>
  );
}
