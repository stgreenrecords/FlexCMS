export interface FaqItemData {
  question: string;
  answer: string;
  category: string;
}

const safeHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '');

interface Props {
  data: FaqItemData;
}

export function FaqItem({ data }: Props) {
  const { question, answer, category } = data;

  return (
    <div className="bg-surface-container-low border border-outline-variant/20 rounded-lg p-6">
      {category && (
        <span className="font-label tracking-widest uppercase text-xs text-primary mb-3 block">
          {category}
        </span>
      )}
      <h3 className="font-headline italic text-on-surface text-lg mb-3">{question}</h3>
      <div
        className="text-sm text-on-surface-variant leading-relaxed prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: safeHtml(answer) }}
      />
    </div>
  );
}
