export interface SponsorShowcaseData {
  title: string;
  sponsors: { name: string; logo: string; tier?: string; url?: string }[];
  cta: { label: string; url: string };
}

interface Props {
  data: SponsorShowcaseData;
}

export function SponsorShowcase({ data }: Props) {
  const { title, sponsors, cta } = data;

  return (
    <section className="py-4">
      <h2 className="font-headline text-2xl text-[var(--color-on-surface)] mb-6">{title}</h2>
      <ul className="flex flex-wrap gap-6 mb-8">
        {sponsors.map((sponsor, i) => {
          const inner = (
            <div className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col items-center gap-2 hover:shadow-md transition-shadow w-40">
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="h-12 w-auto object-contain"
              />
              <span className="font-label text-xs text-[var(--color-on-surface)] text-center">{sponsor.name}</span>
              {sponsor.tier && (
                <span className="font-label text-xs text-[var(--color-primary)] capitalize">{sponsor.tier}</span>
              )}
            </div>
          );

          return (
            <li key={i}>
              {sponsor.url ? (
                <a href={sponsor.url} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
      {cta?.url && (
        <a
          href={cta.url}
          className="font-label text-sm bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded px-5 py-2 inline-block hover:opacity-90 transition-opacity"
        >
          {cta.label}
        </a>
      )}
    </section>
  );
}
