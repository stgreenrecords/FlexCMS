export interface ParagraphData {
  text: string;
  styleVariant: 'default' | 'large' | 'small' | 'lead';
  dropCap: boolean;
}

const styleVariantMap: Record<ParagraphData['styleVariant'], string> = {
  default: 'text-base text-on-surface-variant leading-relaxed',
  large: 'text-lg text-on-surface-variant leading-relaxed',
  small: 'text-sm text-on-surface-variant leading-normal',
  lead: 'text-xl text-on-surface font-medium leading-relaxed',
};

interface Props {
  data: ParagraphData;
}

export function Paragraph({ data }: Props) {
  const { text, styleVariant, dropCap } = data;

  return (
    <p
      className={`${styleVariantMap[styleVariant]} mb-4 whitespace-pre-line${
        dropCap
          ? ' first-letter:text-5xl first-letter:font-headline first-letter:italic first-letter:float-left first-letter:mr-2 first-letter:leading-none first-letter:text-primary'
          : ''
      }`}
    >
      {text}
    </p>
  );
}
