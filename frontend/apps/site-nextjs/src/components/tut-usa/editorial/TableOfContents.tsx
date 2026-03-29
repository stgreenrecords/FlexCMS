export interface TableOfContentsData {
  title: string;
  items: { label: string; url: string }[];
  sticky: boolean;
}

interface Props {
  data: TableOfContentsData;
}

export function TableOfContents({ data }: Props) {
  const { title, items, sticky } = data;

  return (
    <nav
      aria-label={title || 'Table of Contents'}
      className={`bg-surface-container-low border border-outline-variant/20 rounded-xl p-5 ${
        sticky ? 'sticky top-4' : ''
      }`}
    >
      {title && (
        <h2 className="font-label tracking-widest uppercase text-xs text-on-surface mb-4">
          {title}
        </h2>
      )}
      <ol className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-xs text-on-surface-variant/50 shrink-0 pt-px">{i + 1}.</span>
            <a
              href={item.url}
              className="text-sm text-on-surface-variant hover:text-primary transition-colors leading-relaxed"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
