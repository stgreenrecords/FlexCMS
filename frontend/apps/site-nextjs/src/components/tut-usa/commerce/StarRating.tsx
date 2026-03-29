export interface StarRatingData {
  rating: number;
  maxRating: number;
  reviewCount: number;
}

export function StarRating({ data }: { data: StarRatingData }) {
  const max = data.maxRating || 5;
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} className={`text-base ${i < Math.round(data.rating) ? 'text-primary' : 'text-outline-variant/40'}`}>★</span>
        ))}
      </div>
      <span className="font-headline text-sm text-primary">{data.rating?.toFixed(1)}</span>
      {data.reviewCount > 0 && (
        <span className="font-label text-xs text-secondary">({data.reviewCount})</span>
      )}
    </div>
  );
}
