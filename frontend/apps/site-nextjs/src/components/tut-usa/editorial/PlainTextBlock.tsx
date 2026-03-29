export interface PlainTextBlockData {
  title: string;
  text: string;
  maxLength: number;
  alignment: 'left' | 'center' | 'right';
}

const alignMap: Record<PlainTextBlockData['alignment'], string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

interface Props {
  data: PlainTextBlockData;
}

export function PlainTextBlock({ data }: Props) {
  const { title, text, maxLength, alignment } = data;

  const displayText =
    maxLength > 0 && text.length > maxLength
      ? text.slice(0, maxLength) + '…'
      : text;

  return (
    <section className={`py-6 ${alignMap[alignment]}`}>
      {title && (
        <h3 className="font-headline italic text-on-surface text-xl mb-3">
          {title}
        </h3>
      )}
      <p className="text-on-surface-variant leading-relaxed whitespace-pre-line">
        {displayText}
      </p>
    </section>
  );
}
