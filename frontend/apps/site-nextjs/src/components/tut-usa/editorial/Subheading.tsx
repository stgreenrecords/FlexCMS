export interface SubheadingData {
  text: string;
  styleVariant: 'default' | 'muted' | 'accent';
  alignment: 'left' | 'center' | 'right';
}

const styleVariantMap: Record<SubheadingData['styleVariant'], string> = {
  default: 'text-on-surface',
  muted: 'text-on-surface-variant',
  accent: 'text-primary',
};

const alignMap: Record<SubheadingData['alignment'], string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

interface Props {
  data: SubheadingData;
}

export function Subheading({ data }: Props) {
  const { text, styleVariant, alignment } = data;

  return (
    <p
      className={`font-headline italic text-lg md:text-xl mb-3 ${styleVariantMap[styleVariant]} ${alignMap[alignment]}`}
    >
      {text}
    </p>
  );
}
