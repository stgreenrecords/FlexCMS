export interface QuoteData {
  quoteText: string;
  authorName: string;
  authorTitle: string;
  source: string;
}

interface Props {
  data: QuoteData;
}

export function Quote({ data }: Props) {
  const { quoteText, authorName, authorTitle, source } = data;

  return (
    <blockquote className="relative border-l-4 border-primary pl-6 py-4 my-8">
      <p className="font-headline italic text-2xl text-on-surface leading-snug mb-4">
        &ldquo;{quoteText}&rdquo;
      </p>
      <footer className="flex flex-col gap-1">
        {authorName && (
          <cite className="not-italic font-label tracking-widest uppercase text-xs text-primary">
            {authorName}
          </cite>
        )}
        {authorTitle && (
          <span className="text-sm text-on-surface-variant">{authorTitle}</span>
        )}
        {source && (
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-on-surface-variant underline underline-offset-2 hover:text-primary transition-colors"
          >
            Source
          </a>
        )}
      </footer>
    </blockquote>
  );
}
