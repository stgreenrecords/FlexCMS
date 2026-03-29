export interface BuyerGuideSection {
  heading: string;
  body: string;
}

export interface BuyerGuideData {
  title: string;
  introduction: string;
  sections: BuyerGuideSection[];
  /** Downloadable guide file */
  downloadFile: string;
}

export function BuyerGuide({ data }: { data: BuyerGuideData }) {
  return (
    <article className="px-12 py-20 max-w-4xl mx-auto">
      <h2 className="font-headline italic text-4xl text-on-surface mb-6">{data.title}</h2>
      {data.introduction && (
        <p className="font-body text-lg text-secondary mb-12 leading-relaxed">{data.introduction}</p>
      )}
      {data.sections && data.sections.length > 0 && (
        <div className="space-y-10 mb-12">
          {data.sections.map((s, i) => (
            <div key={i}>
              <h3 className="font-headline italic text-2xl text-on-surface mb-4">{s.heading}</h3>
              <p className="font-body text-secondary leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      )}
      {data.downloadFile && (
        <a
          href={data.downloadFile}
          download
          className="inline-flex items-center gap-3 bg-primary text-on-primary px-8 py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all"
        >
          <span>↓</span> Download Guide
        </a>
      )}
    </article>
  );
}
