export interface CampaignHeroData {
  title: string;
  description: string;
  items: string[];
  layout: 'centered' | 'split' | 'overlay';
  cta: { label: string; url: string };
}

export function CampaignHero({ data }: { data: CampaignHeroData }) {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center text-center px-12 overflow-hidden bg-surface-container-highest">
      <div className="relative z-10 max-w-3xl">
        <h2 className="font-headline italic text-6xl text-on-surface mb-8">{data.title}</h2>
        {data.description && (
          <p className="font-body text-lg text-secondary mb-12">{data.description}</p>
        )}
        {data.cta?.label && (
          <a
            href={data.cta.url}
            className="inline-block bg-primary text-on-primary px-12 py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all"
          >
            {data.cta.label}
          </a>
        )}
      </div>
    </section>
  );
}
