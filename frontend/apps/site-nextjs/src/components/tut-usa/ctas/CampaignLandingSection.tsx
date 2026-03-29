function safeHtml(raw: string): string {
  return raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

export interface CampaignLandingSectionData {
  headline: string;
  body: string;
  /** Campaign media — 1200×600 */
  media: string;
  primaryCta: { label: string; url: string };
  trackingCode: string;
}

export function CampaignLandingSection({ data }: { data: CampaignLandingSectionData }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] items-center">
      <div className="px-12 py-20">
        <h2 className="font-headline italic text-5xl text-on-surface mb-8">{data.headline}</h2>
        {data.body && (
          <div
            className="font-body text-secondary mb-12 leading-relaxed prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: safeHtml(data.body) }}
          />
        )}
        {data.primaryCta?.label && (
          <a
            href={data.primaryCta.url}
            className="inline-block bg-primary text-on-primary px-10 py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all"
          >
            {data.primaryCta.label}
          </a>
        )}
      </div>
      <div className="relative h-full min-h-[400px] bg-surface-container-highest overflow-hidden">
        {data.media && (
          <img src={data.media} alt={data.headline} className="w-full h-full object-cover" />
        )}
      </div>
    </section>
  );
}
