export interface ResearchPaperDetailData {
  title: string;
  abstract: string;
  authors: string[];
  /** File — 48×48 icon */
  file: string;
  keywords: string[];
}

interface Props {
  data: ResearchPaperDetailData;
}

export function ResearchPaperDetail({ data }: Props) {
  const { title, abstract, authors, file, keywords } = data;

  return (
    <article className="max-w-3xl mx-auto py-8 px-4">
      <header className="mb-6">
        <p className="font-label tracking-widest uppercase text-xs text-primary mb-3">
          Research Paper
        </p>
        <h1 className="font-headline italic text-on-surface text-4xl mb-4 leading-tight">
          {title}
        </h1>
        {authors.length > 0 && (
          <p className="text-sm text-on-surface-variant">{authors.join(', ')}</p>
        )}
      </header>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {keywords.map((kw, i) => (
            <span
              key={i}
              className="text-xs text-on-surface-variant border border-outline-variant/20 rounded px-2 py-0.5"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
      {abstract && (
        <section className="bg-surface-container-low border border-outline-variant/20 rounded-lg p-6 mb-6">
          <h2 className="font-label tracking-widest uppercase text-xs text-on-surface mb-3">
            Abstract
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">{abstract}</p>
        </section>
      )}
      {file && (
        <a
          href={file}
          download
          className="inline-flex items-center gap-3 bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 hover:border-primary/40 transition-colors"
        >
          <img
            src={file}
            alt=""
            width={48}
            height={48}
            aria-hidden="true"
            className="w-6 h-6 object-contain"
          />
          <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
            Download Paper
          </span>
        </a>
      )}
    </article>
  );
}
