import type { WkndComponent } from '@/lib/flexcms';

interface Props {
  component: WkndComponent;
}

export function TextRenderer({ component }: Props) {
  const text = (component.data?.text as string) ?? '';
  if (!text) return null;

  // Render as rich text if it contains HTML tags, otherwise as a paragraph
  const isHtml = /<[a-z][\s\S]*>/i.test(text);
  if (isHtml) {
    return (
      <div
        className="wknd-richtext max-w-prose mx-auto px-4 py-4"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }
  return <p className="max-w-prose mx-auto px-4 py-4 leading-relaxed">{text}</p>;
}
