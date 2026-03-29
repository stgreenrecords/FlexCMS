const safeHtml = (raw: string): string =>
  raw.replace(/<script[\s\S]*?<\/script>/gi, '');

export interface PartnerDetailData {
  partnerName: string;
  summary: string;
  /** Partner logo — 200×80 */
  logo: string;
  website: string;
  offeringDetails: string;
}

interface Props {
  data: PartnerDetailData;
}

export function PartnerDetail({ data }: Props) {
  const { partnerName, summary, logo, website, offeringDetails } = data;

  return (
    <article className="bg-surface-container rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {logo && (
          <img
            src={logo}
            alt={partnerName}
            width={200}
            height={80}
            className="h-16 w-auto object-contain flex-shrink-0"
          />
        )}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <h2 className="font-headline italic text-on-surface text-2xl">{partnerName}</h2>
          {summary && (
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">{summary}</p>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-label uppercase text-xs tracking-widest text-primary hover:underline self-start mt-1"
            >
              Visit Website
            </a>
          )}
        </div>
      </div>
      {offeringDetails && (
        <div className="border-t border-outline-variant/40 pt-4">
          <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-3">
            Offering Details
          </span>
          <div
            className="font-body text-sm text-on-surface leading-relaxed prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: safeHtml(offeringDetails) }}
          />
        </div>
      )}
    </article>
  );
}
