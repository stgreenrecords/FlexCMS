export interface RewardsCardData {
  title: string;
  description: string;
  pointsRequired: number;
  cta: { label: string; url: string };
}

export function RewardsCard({ data }: { data: RewardsCardData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-6">
      <span className="font-label uppercase text-xs tracking-widest text-primary block mb-2">
        {data.pointsRequired?.toLocaleString()} pts
      </span>
      <h3 className="font-headline italic text-xl text-on-surface mb-3">{data.title}</h3>
      {data.description && <p className="font-body text-sm text-secondary mb-4">{data.description}</p>}
      {data.cta?.label && (
        <a href={data.cta.url} className="font-label uppercase text-xs tracking-widest text-primary hover:underline">
          {data.cta.label} →
        </a>
      )}
    </div>
  );
}
