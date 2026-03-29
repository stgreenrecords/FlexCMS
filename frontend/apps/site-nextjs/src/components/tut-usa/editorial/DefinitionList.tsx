export interface DefinitionListData {
  title: string;
  items: { term: string; definition: string }[];
  layout: 'vertical' | 'horizontal';
}

interface Props {
  data: DefinitionListData;
}

export function DefinitionList({ data }: Props) {
  const { title, items, layout } = data;

  return (
    <section className="py-6">
      {title && (
        <h3 className="font-headline italic text-on-surface text-xl mb-4">{title}</h3>
      )}
      <dl
        className={`${
          layout === 'horizontal'
            ? 'grid grid-cols-[auto_1fr] gap-x-6 gap-y-3'
            : 'flex flex-col gap-4'
        }`}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className={layout === 'horizontal' ? 'contents' : 'flex flex-col gap-1'}
          >
            <dt className="font-label tracking-widest uppercase text-xs text-primary">
              {item.term}
            </dt>
            <dd className="text-on-surface-variant text-sm leading-relaxed">
              {item.definition}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
