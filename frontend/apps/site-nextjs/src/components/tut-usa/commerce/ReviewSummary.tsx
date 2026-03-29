export interface RatingBucket {
  stars: number;
  count: number;
}

export interface ReviewSummaryData {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: RatingBucket[];
}

export function ReviewSummary({ data }: { data: ReviewSummaryData }) {
  const max = data.ratingDistribution?.reduce((m, b) => Math.max(m, b.count), 1) || 1;
  return (
    <div className="bg-surface-container p-8">
      <div className="flex items-start gap-10">
        <div className="text-center">
          <span className="font-headline text-6xl text-primary block">{data.averageRating?.toFixed(1)}</span>
          <div className="flex gap-1 justify-center my-2">
            {[1,2,3,4,5].map(s => (
              <span key={s} className={`text-sm ${s <= Math.round(data.averageRating) ? 'text-primary' : 'text-outline-variant/40'}`}>★</span>
            ))}
          </div>
          <span className="font-label text-xs text-secondary uppercase tracking-widest">{data.reviewCount} reviews</span>
        </div>
        {data.ratingDistribution && data.ratingDistribution.length > 0 && (
          <div className="flex-1 space-y-2">
            {[...data.ratingDistribution].reverse().map((bucket, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-label text-xs text-secondary w-8">{bucket.stars}★</span>
                <div className="flex-1 h-2 bg-surface-container-high">
                  <div
                    className="h-2 bg-primary"
                    style={{ width: `${(bucket.count / max) * 100}%` }}
                  />
                </div>
                <span className="font-label text-xs text-secondary w-6">{bucket.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
