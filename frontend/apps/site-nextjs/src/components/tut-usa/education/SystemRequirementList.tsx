export interface RequirementCategory {
  category: string;
  items: string[];
}

export interface SystemRequirementListData {
  title: string;
  requirements: RequirementCategory[];
  supportedPlatforms: string[];
}

interface Props {
  data: SystemRequirementListData;
}

export function SystemRequirementList({ data }: Props) {
  const { title, requirements, supportedPlatforms } = data;

  return (
    <section className="bg-surface-container border border-outline-variant rounded-2xl p-8 flex flex-col gap-8">
      <h2 className="font-headline text-2xl text-on-surface">{title}</h2>

      {supportedPlatforms.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-label font-semibold text-sm text-secondary uppercase tracking-wider">
            Supported Platforms
          </h3>
          <ul className="flex flex-wrap gap-2">
            {supportedPlatforms.map((platform) => (
              <li
                key={platform}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-outline-variant text-on-surface font-label"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {platform}
              </li>
            ))}
          </ul>
        </div>
      )}

      {requirements.length > 0 && (
        <div className="flex flex-col gap-6">
          {requirements.map((req) => (
            <div key={req.category} className="flex flex-col gap-3">
              <h3
                className="font-label font-semibold text-sm px-3 py-1 rounded-lg w-fit"
                style={{
                  backgroundColor: 'var(--color-secondary-container)',
                  color: 'var(--color-on-secondary-container)',
                }}
              >
                {req.category}
              </h3>
              <ul className="flex flex-col gap-2">
                {req.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-on-surface">
                    <span
                      className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
