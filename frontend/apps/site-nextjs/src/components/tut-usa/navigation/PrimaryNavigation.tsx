interface MenuItemData { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function PrimaryNavigation({ data }: Props) {
  const menuItems = (data.menuItems as MenuItemData[]) ?? [];
  const sticky = (data.sticky as boolean) ?? false;

  const positionClass = sticky ? 'sticky top-0 z-40' : 'relative';

  return (
    <nav
      aria-label="Primary navigation"
      className={`${positionClass} bg-black border-b border-neutral-800`}
    >
      <ul className="flex items-center gap-0 px-8 h-12 list-none m-0 p-0">
        {menuItems.map((item, i) => (
          <li key={i}>
            <a
              href={item.url}
              className="inline-block px-4 py-3 text-xs text-neutral-300 hover:text-white uppercase tracking-widest transition-colors duration-200"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
