export interface PartnerPortalLinkData {
  title: string;
  description: string;
  portalUrl: string;
  audience: string;
}

export function PartnerPortalLink({ data }: { data: PartnerPortalLinkData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-8">
      {data.audience && (
        <span className="font-label uppercase text-xs tracking-[0.3em] text-primary block mb-4">{data.audience}</span>
      )}
      <h3 className="font-headline italic text-2xl text-on-surface mb-3">{data.title}</h3>
      {data.description && <p className="font-body text-sm text-secondary mb-6">{data.description}</p>}
      {data.portalUrl && (
        <a
          href={data.portalUrl}
          className="inline-block bg-primary text-on-primary px-8 py-3 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all"
        >
          Access Portal →
        </a>
      )}
    </div>
  );
}
