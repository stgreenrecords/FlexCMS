export interface ChecklistData {
  title: string;
  items: { label: string; checked: boolean }[];
  showIcons: boolean;
}

interface Props {
  data: ChecklistData;
}

export function Checklist({ data }: Props) {
  const { title, items, showIcons } = data;

  return (
    <section className="py-6">
      {title && (
        <h3 className="font-headline italic text-on-surface text-xl mb-4">{title}</h3>
      )}
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            {showIcons && (
              <span
                className={`mt-0.5 shrink-0 text-lg leading-none ${
                  item.checked ? 'text-primary' : 'text-on-surface-variant/40'
                }`}
                aria-hidden="true"
              >
                {item.checked ? '✓' : '○'}
              </span>
            )}
            <span
              className={`text-sm leading-relaxed ${
                item.checked
                  ? 'text-on-surface line-through decoration-on-surface-variant/40'
                  : 'text-on-surface-variant'
              }`}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
