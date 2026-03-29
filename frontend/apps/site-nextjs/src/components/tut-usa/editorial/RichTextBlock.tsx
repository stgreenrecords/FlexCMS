export interface RichTextBlockData {
  heading: string;
  body: string;
  alignment: 'left' | 'center' | 'right';
  backgroundColor: string;
  spacing: 'small' | 'medium' | 'large';
}

const safeHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '');

const spacingMap: Record<RichTextBlockData['spacing'], string> = {
  small: 'py-4',
  medium: 'py-8',
  large: 'py-16',
};

const alignMap: Record<RichTextBlockData['alignment'], string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

interface Props {
  data: RichTextBlockData;
}

export function RichTextBlock({ data }: Props) {
  const { heading, body, alignment, backgroundColor, spacing } = data;

  return (
    <section
      className={`${spacingMap[spacing]} ${alignMap[alignment]}`}
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      {heading && (
        <h2 className="font-headline italic text-on-surface text-2xl md:text-3xl mb-4">
          {heading}
        </h2>
      )}
      <div
        className="prose prose-invert max-w-none text-on-surface-variant leading-relaxed"
        dangerouslySetInnerHTML={{ __html: safeHtml(body) }}
      />
    </section>
  );
}
