export interface CaseStudyDetailData {
  headline: string;
  challenge: string;
  solution: string;
  results: string;
  /** Hero image — 1920×1080 */
  heroImage: string;
  /** Download asset icon — 48×48 */
  downloadAsset: string;
}

interface Props {
  data: CaseStudyDetailData;
}

export function CaseStudyDetail({ data }: Props) {
  const { headline, challenge, solution, results, heroImage, downloadAsset } = data;

  return (
    <article>
      {heroImage && (
        <div className="relative w-full aspect-video overflow-hidden mb-8">
          <img
            src={heroImage}
            alt={headline}
            width={1920}
            height={1080}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="font-headline italic text-on-surface text-4xl md:text-5xl mb-8">
          {headline}
        </h1>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {[
            { heading: 'Challenge', content: challenge },
            { heading: 'Solution', content: solution },
            { heading: 'Results', content: results },
          ].map(({ heading, content }) => (
            <div key={heading}>
              <h2 className="font-label tracking-widest uppercase text-xs text-primary mb-3">
                {heading}
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">{content}</p>
            </div>
          ))}
        </div>
        {downloadAsset && (
          <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant/20 rounded-lg p-4 w-fit">
            <img
              src={downloadAsset}
              alt=""
              width={48}
              height={48}
              aria-hidden="true"
            />
            <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
              Download Case Study
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
