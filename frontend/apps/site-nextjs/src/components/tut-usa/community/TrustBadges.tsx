export interface TrustBadgesData {
  title: string;
  badges: string[];
  captions: string[];
}

interface Props {
  data: TrustBadgesData;
}

export function TrustBadges({ data }: Props) {
  const { title, badges, captions } = data;

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      {title && (
        <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
      )}
      {badges && badges.length > 0 ? (
        <div className="flex flex-wrap gap-6 items-end">
          {badges.map((badge, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <img
                src={badge}
                alt={captions?.[i] ?? `Badge ${i + 1}`}
                width={80}
                height={80}
                className="h-16 w-auto object-contain"
              />
              {captions?.[i] && (
                <span className="font-label uppercase text-xs tracking-widest text-secondary text-center">
                  {captions[i]}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">No badges to display.</p>
      )}
    </section>
  );
}
