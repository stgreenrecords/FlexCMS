interface LinkItem { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function LinkList({ data }: Props) {
  const title = (data.title as string) ?? '';
  const links = (data.links as LinkItem[]) ?? [];
  const columns = (data.columns as number) ?? 1;

  return (
    <div className="py-4">
      {title && (
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">
          {title}
        </h3>
      )}
      <ul
        className="list-none m-0 p-0 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {links.map((link, i) => (
          <li key={i}>
            <a
              href={link.url}
              className="text-sm text-neutral-300 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
