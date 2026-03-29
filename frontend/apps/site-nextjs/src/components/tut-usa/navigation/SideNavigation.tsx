interface LinkItem { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function SideNavigation({ data }: Props) {
  const title = (data.title as string) ?? '';
  const items = (data.items as LinkItem[]) ?? [];
  const sticky = (data.sticky as boolean) ?? false;

  const stickyClass = sticky ? 'sticky top-20' : '';

  return (
    <nav
      aria-label={title || 'Side navigation'}
      className={`${stickyClass} w-56 flex-shrink-0`}
    >
      {title && (
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4 pb-3 border-b border-neutral-800">
          {title}
        </h3>
      )}
      <ul className="flex flex-col gap-1 list-none m-0 p-0">
        {items.map((item, i) => (
          <li key={i}>
            <a
              href={item.url}
              className="block py-2 text-sm text-neutral-400 hover:text-white border-l-2 border-transparent hover:border-white pl-3 transition-all duration-200"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
