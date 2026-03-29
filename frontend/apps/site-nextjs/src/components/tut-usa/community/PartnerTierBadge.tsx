export interface PartnerTierBadgeData {
  tierName: string;
  /** Tier icon — 48×48 */
  icon: string;
  description: string;
}

interface Props {
  data: PartnerTierBadgeData;
}

export function PartnerTierBadge({ data }: Props) {
  const { tierName, icon, description } = data;

  return (
    <div className="bg-surface-container rounded-lg border border-outline-variant/40 px-4 py-3 inline-flex items-center gap-3">
      {icon && (
        <img
          src={icon}
          alt={tierName}
          width={48}
          height={48}
          className="w-10 h-10 object-contain flex-shrink-0"
        />
      )}
      <div className="flex flex-col gap-0.5">
        <span className="font-headline italic text-on-surface text-sm leading-tight">{tierName}</span>
        {description && (
          <span className="font-label uppercase text-xs tracking-widest text-secondary">{description}</span>
        )}
      </div>
    </div>
  );
}
