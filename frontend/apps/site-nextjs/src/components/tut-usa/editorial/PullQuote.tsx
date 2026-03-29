export interface PullQuoteData {
  quoteText: string;
  attribution: string;
  alignment: 'left' | 'center' | 'right';
}

const alignMap: Record<PullQuoteData['alignment'], string> = {
  left: 'text-left mr-auto',
  center: 'text-center mx-auto',
  right: 'text-right ml-auto',
};

interface Props {
  data: PullQuoteData;
}

export function PullQuote({ data }: Props) {
  const { quoteText, attribution, alignment } = data;

  return (
    <aside
      className={`${alignMap[alignment]} border-t border-b border-outline-variant/20 py-6 my-8 max-w-2xl`}
    >
      <p className="font-headline italic text-3xl text-on-surface leading-snug mb-3">
        &ldquo;{quoteText}&rdquo;
      </p>
      {attribution && (
        <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
          — {attribution}
        </span>
      )}
    </aside>
  );
}
