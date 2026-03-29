export interface ShowcasePartner {
  name: string;
  logo: string;
  url?: string;
}

export interface PartnerShowcaseData {
  title: string;
  partners: ShowcasePartner[];
  cta: { label: string; url: string };
}

interface Props {
  data: PartnerShowcaseData;
}

export function PartnerShowcase({ data }: Props) {
  const { title, partners, cta } = data;

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-6">
      {title && (
        <h2 className="font-headline italic text-on-surface text-2xl">{title}</h2>
      )}
      {partners && partners.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {partners.map((partner) => {
            const inner = (
              <div className="flex flex-col items-center gap-2">
                {partner.logo && (
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    width={120}
                    height={60}
                    className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                  />
                )}
                <span className="font-label uppercase text-xs tracking-widest text-secondary text-center">
                  {partner.name}
                </span>
              </div>
            );
            return (
              <div key={partner.name} className="flex items-center justify-center">
                {partner.url ? (
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2"
                  >
                    {inner}
                  </a>
                ) : inner}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">No partners to display.</p>
      )}
      {cta?.url && (
        <div className="pt-2 border-t border-outline-variant/40">
          <a
            href={cta.url}
            className="inline-block bg-primary text-on-primary font-label uppercase text-xs tracking-widest px-5 py-2.5 rounded hover:bg-primary-fixed transition-colors"
          >
            {cta.label}
          </a>
        </div>
      )}
    </section>
  );
}
