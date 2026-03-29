export interface HeadingData {
  text: string;
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  styleVariant: 'display' | 'headline' | 'title' | 'label';
  anchorId: string;
}

const styleVariantMap: Record<HeadingData['styleVariant'], string> = {
  display: 'font-headline italic text-on-surface text-5xl md:text-6xl tracking-tight',
  headline: 'font-headline italic text-on-surface text-3xl md:text-4xl',
  title: 'font-headline italic text-on-surface text-xl md:text-2xl',
  label: 'font-label tracking-widest uppercase text-on-surface-variant text-sm',
};

interface Props {
  data: HeadingData;
}

export function Heading({ data }: Props) {
  const { text, level: Tag, styleVariant, anchorId } = data;

  return (
    <Tag
      id={anchorId || undefined}
      className={`${styleVariantMap[styleVariant]} mb-4`}
    >
      {text}
    </Tag>
  );
}
