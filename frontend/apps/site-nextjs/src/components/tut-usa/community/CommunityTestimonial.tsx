export interface CommunityTestimonialData {
  quote: string;
  customerName: string;
  customerTitle: string;
  company: string;
  /** Photo — 80×80 */
  photo: string;
}

interface Props {
  data: CommunityTestimonialData;
}

export function CommunityTestimonial({ data }: Props) {
  const { quote, customerName, customerTitle, company, photo } = data;

  return (
    <blockquote className="bg-surface-container rounded-xl border border-outline-variant/40 p-8 flex flex-col gap-6">
      {quote && (
        <p className="font-headline italic text-on-surface text-2xl leading-snug before:content-['\u201c'] after:content-['\u201d']">
          {quote}
        </p>
      )}
      <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/40">
        {photo && (
          <img
            src={photo}
            alt={customerName}
            width={80}
            height={80}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div className="flex flex-col">
          <span className="font-body text-on-surface text-sm font-medium">{customerName}</span>
          {(customerTitle || company) && (
            <span className="font-label uppercase text-xs tracking-widest text-secondary">
              {[customerTitle, company].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>
    </blockquote>
  );
}
