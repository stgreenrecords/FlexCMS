export interface LoyaltySummaryData {
  pointsBalance: number;
  tierName: string;
  nextTierThreshold: number;
  rewardsUrl: string;
}

export function LoyaltySummary({ data }: { data: LoyaltySummaryData }) {
  const progress = data.nextTierThreshold > 0
    ? Math.min((data.pointsBalance / data.nextTierThreshold) * 100, 100)
    : 100;
  return (
    <div className="bg-surface-container p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">Loyalty Tier</span>
          <h3 className="font-headline italic text-2xl text-on-surface">{data.tierName}</h3>
        </div>
        <div className="text-right">
          <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">Points</span>
          <span className="font-headline text-3xl text-primary">{data.pointsBalance?.toLocaleString()}</span>
        </div>
      </div>
      {data.nextTierThreshold > 0 && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-label text-xs text-secondary uppercase tracking-widest">Progress to next tier</span>
            <span className="font-label text-xs text-secondary">{data.nextTierThreshold?.toLocaleString()} pts</span>
          </div>
          <div className="h-2 bg-surface-container-high">
            <div className="h-2 bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {data.rewardsUrl && (
        <a href={data.rewardsUrl} className="font-label uppercase text-xs tracking-widest text-primary hover:underline">
          View Rewards →
        </a>
      )}
    </div>
  );
}
