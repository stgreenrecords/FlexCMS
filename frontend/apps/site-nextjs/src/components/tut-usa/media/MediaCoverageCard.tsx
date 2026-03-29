export interface MediaCoverageCardData {
  publication: string;
  headline: string;
  date: string;
  url: string;
  /** Logo — 120×40 */
  logo: string;
}

export function MediaCoverageCard({ data }: { data: MediaCoverageCardData }) {
  return (
    <article className="bg-surface-container-low rounded-lg p-5 flex flex-col gap-3 hover:bg-surface-container-highest transition">
      <div className="flex items-center justify-between gap-3">
        {data.logo ? (
          <img
            src={data.logo}
            alt={data.publication}
            className="h-8 max-w-[120px] object-contain filter brightness-75"
            loading="lazy"
          />
        ) : (
          <span className="text-sm font-semibold text-on-surface-variant">
            {data.publication}
          </span>
        )}
        {data.date && (
          <time className="text-xs text-on-surface-variant/60 whitespace-nowrap">
            {data.date}
          </time>
        )}
      </div>

      {data.headline && (
        <h3 className="text-on-surface font-semibold leading-snug">{data.headline}</h3>
      )}

      {data.url && (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm underline self-start"
        >
          Read Article &#8594;
        </a>
      )}
    </article>
  );
}
