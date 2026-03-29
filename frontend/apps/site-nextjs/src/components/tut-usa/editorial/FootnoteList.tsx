export interface FootnoteListData {
  items: { index: number; text: string }[];
  styleVariant: 'numbered' | 'symbol';
}

const symbols = ['*', '†', '‡', '§', '‖', '¶', '**', '††'];

interface Props {
  data: FootnoteListData;
}

export function FootnoteList({ data }: Props) {
  const { items, styleVariant } = data;

  return (
    <footer className="border-t border-outline-variant/20 pt-6 mt-8">
      <ol className="flex flex-col gap-2">
        {items.map((item, listIndex) => {
          const marker =
            styleVariant === 'symbol'
              ? symbols[listIndex % symbols.length]
              : `${item.index}`;

          return (
            <li
              key={item.index}
              id={`fn-${item.index}`}
              className="flex gap-2 text-xs text-on-surface-variant leading-relaxed"
            >
              <span className="shrink-0 text-primary font-bold">{marker}</span>
              <span>{item.text}</span>
            </li>
          );
        })}
      </ol>
    </footer>
  );
}
