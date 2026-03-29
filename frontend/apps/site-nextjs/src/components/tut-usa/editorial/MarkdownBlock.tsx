export interface MarkdownBlockData {
  title: string;
  markdown: string;
  renderMode: 'html' | 'plain';
}

interface Props {
  data: MarkdownBlockData;
}

function renderPlain(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .trim();
}

function renderHtmlLike(markdown: string): React.ReactNode[] {
  const blocks = markdown.split(/\n{2,}/);
  return blocks.map((block, i) => {
    const headingMatch = block.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      return (
        <Tag key={i} className="font-headline italic text-on-surface mb-2">
          {text}
        </Tag>
      );
    }
    if (block.startsWith('- ') || block.startsWith('* ')) {
      const items = block.split('\n').filter(Boolean);
      return (
        <ul key={i} className="list-disc list-inside text-on-surface-variant mb-2 space-y-1">
          {items.map((item, j) => (
            <li key={j}>{item.replace(/^[-*]\s+/, '')}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="text-on-surface-variant leading-relaxed mb-3 whitespace-pre-line">
        {block}
      </p>
    );
  });
}

export function MarkdownBlock({ data }: Props) {
  const { title, markdown, renderMode } = data;

  return (
    <section className="py-6">
      {title && (
        <h3 className="font-headline italic text-on-surface text-xl mb-4">{title}</h3>
      )}
      {renderMode === 'plain' ? (
        <p className="text-on-surface-variant leading-relaxed whitespace-pre-line">
          {renderPlain(markdown)}
        </p>
      ) : (
        <div>{renderHtmlLike(markdown)}</div>
      )}
    </section>
  );
}
