export interface CertificationLevel {
  name: string;
  description: string;
  duration?: string;
  badge?: string;
}

export interface CertificationPathData {
  title: string;
  levels: CertificationLevel[];
  estimatedDuration: string;
  cta: { label: string; url: string };
}

interface Props {
  data: CertificationPathData;
}

export function CertificationPath({ data }: Props) {
  const { title, levels, estimatedDuration, cta } = data;

  return (
    <section className="bg-surface-container border border-outline-variant rounded-2xl p-8 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-headline text-3xl text-on-surface">{title}</h2>
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Estimated: {estimatedDuration}</span>
        </div>
      </div>

      {levels.length > 0 && (
        <ol className="flex flex-col gap-0">
          {levels.map((level, index) => (
            <li key={index} className="flex gap-4">
              {/* Connector column */}
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-label font-bold"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                  }}
                >
                  {index + 1}
                </div>
                {index < levels.length - 1 && (
                  <div
                    className="w-0.5 flex-1 min-h-6 my-1"
                    style={{ backgroundColor: 'var(--color-outline-variant)' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`flex flex-col gap-1 pb-6 flex-1 ${index === levels.length - 1 ? 'pb-0' : ''}`}>
                <div className="flex items-center gap-3">
                  {level.badge && (
                    <img
                      src={level.badge}
                      alt={`${level.name} badge`}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                  )}
                  <h3 className="font-label font-semibold text-base text-on-surface">
                    {level.name}
                  </h3>
                  {level.duration && (
                    <span className="text-xs text-secondary font-label">· {level.duration}</span>
                  )}
                </div>
                <p className="text-sm text-secondary leading-relaxed">{level.description}</p>
              </div>
            </li>
          ))}
        </ol>
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
