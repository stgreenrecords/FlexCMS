export interface LogoGridData {
  title: string;
  logos: string[];
  columns: number;
  linkMode: boolean;
}

export function LogoGrid({ data }: { data: LogoGridData }) {
  const colClass = `grid-cols-2 sm:grid-cols-${Math.min(data.columns || 4, 6)}`;

  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-6">{data.title}</h2>
      )}
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${data.columns || 4}, minmax(0, 1fr))`,
        }}
      >
        {data.logos?.map((src, i) =>
          data.linkMode ? (
            <a
              key={i}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-surface-container-low rounded-lg p-4 hover:bg-surface-container-highest transition"
              aria-label={`Logo ${i + 1}`}
            >
              <img
                src={src}
                alt={`Logo ${i + 1}`}
                className="max-h-12 max-w-full object-contain filter brightness-75 hover:brightness-100 transition"
                loading="lazy"
              />
            </a>
          ) : (
            <div
              key={i}
              className="flex items-center justify-center bg-surface-container-low rounded-lg p-4"
            >
              <img
                src={src}
                alt={`Logo ${i + 1}`}
                className="max-h-12 max-w-full object-contain filter brightness-75"
                loading="lazy"
              />
            </div>
          )
        )}
      </div>
    </section>
  );
}
