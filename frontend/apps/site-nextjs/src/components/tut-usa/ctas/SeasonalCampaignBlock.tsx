export interface SeasonalCampaignBlockData {
  title: string;
  description: string;
  /** Campaign image — 1200×600 */
  image: string;
  startDate: string;
  endDate: string;
  cta: { label: string; url: string };
}

export function SeasonalCampaignBlock({ data }: { data: SeasonalCampaignBlockData }) {
  const now = new Date();
  if (data.startDate && new Date(data.startDate) > now) return null;
  if (data.endDate && new Date(data.endDate) < now) return null;

  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden bg-surface-container-highest">
      {data.image && (
        <img
          src={data.image}
          alt={data.title}
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      )}
      <div className="relative z-10 px-12 py-20 max-w-2xl">
        <h2 className="font-headline italic text-5xl text-on-surface mb-6">{data.title}</h2>
        {data.description && (
          <p className="font-body text-lg text-secondary mb-10">{data.description}</p>
        )}
        {data.endDate && (
          <p className="font-label text-xs text-secondary uppercase tracking-widest mb-8">
            Offer ends {new Date(data.endDate).toLocaleDateString()}
          </p>
        )}
        {data.cta?.label && (
          <a
            href={data.cta.url}
            className="inline-block bg-primary text-on-primary px-10 py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all"
          >
            {data.cta.label}
          </a>
        )}
      </div>
    </section>
  );
}
