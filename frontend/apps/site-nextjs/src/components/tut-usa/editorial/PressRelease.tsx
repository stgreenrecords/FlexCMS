export interface PressReleaseData {
  headline: string;
  summary: string;
  body: string;
  releaseDate: string;
  mediaContact: string;
}

const safeHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '');

interface Props {
  data: PressReleaseData;
}

export function PressRelease({ data }: Props) {
  const { headline, summary, body, releaseDate, mediaContact } = data;

  return (
    <article className="max-w-3xl mx-auto py-8 px-4">
      <header className="mb-8 border-b border-outline-variant/20 pb-6">
        <p className="font-label tracking-widest uppercase text-xs text-primary mb-3">
          Press Release
        </p>
        <h1 className="font-headline italic text-on-surface text-4xl mb-4 leading-tight">
          {headline}
        </h1>
        {releaseDate && (
          <time
            dateTime={releaseDate}
            className="font-label tracking-widest uppercase text-xs text-on-surface-variant"
          >
            {releaseDate}
          </time>
        )}
      </header>
      {summary && (
        <p className="text-on-surface text-lg leading-relaxed mb-8 font-medium">{summary}</p>
      )}
      <div
        className="prose prose-invert max-w-none text-on-surface-variant leading-relaxed mb-10"
        dangerouslySetInnerHTML={{ __html: safeHtml(body) }}
      />
      {mediaContact && (
        <footer className="border-t border-outline-variant/20 pt-6">
          <h2 className="font-label tracking-widest uppercase text-xs text-on-surface mb-2">
            Media Contact
          </h2>
          <p className="text-sm text-on-surface-variant whitespace-pre-line">{mediaContact}</p>
        </footer>
      )}
    </article>
  );
}
