export interface Review {
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
}

export interface ReviewListData {
  reviews: Review[];
  sortOptions: string[];
  showFilters: boolean;
}

export function ReviewList({ data }: { data: ReviewListData }) {
  return (
    <section className="bg-background py-10 px-8">
      <div className="flex items-center justify-between mb-8">
        <span className="font-label uppercase text-xs tracking-[0.3em] text-primary">
          {data.reviews?.length ?? 0} Reviews
        </span>
        {data.showFilters && data.sortOptions && data.sortOptions.length > 0 && (
          <select className="bg-transparent border border-outline-variant/40 py-2 px-4 font-label text-xs uppercase tracking-widest text-secondary focus:outline-none">
            {data.sortOptions.map((opt, i) => <option key={i}>{opt}</option>)}
          </select>
        )}
      </div>
      {data.reviews && data.reviews.length > 0 && (
        <div className="space-y-8">
          {data.reviews.map((review, i) => (
            <div key={i} className="border-b border-outline-variant/20 pb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <span className="font-label text-xs uppercase tracking-widest text-on-surface">{review.author}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-xs ${s <= review.rating ? 'text-primary' : 'text-outline-variant/40'}`}>★</span>
                    ))}
                  </div>
                </div>
                <span className="font-label text-xs text-secondary">{review.date}</span>
              </div>
              {review.title && <h4 className="font-label text-sm text-on-surface mb-2">{review.title}</h4>}
              {review.body && <p className="font-body text-sm text-secondary leading-relaxed">{review.body}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
