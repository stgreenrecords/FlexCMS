interface LinkItem { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function SecondaryNavigation({ data }: Props) {
  const title = (data.title as string) ?? '';
  const links = (data.links as LinkItem[]) ?? [];

  return (
    <nav aria-label={title || 'Secondary navigation'} className="bg-neutral-950 border-b border-neutral-800">
      <div className="flex items-center gap-2 px-8 h-10">
        {title && (
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mr-4">
            {title}
          </span>
        )}
        <ul className="flex items-center gap-0 list-none m-0 p-0">
          {links.map((link, i) => (
            <li key={i}>
              <a
                href={link.url}
                className="inline-block px-3 text-xs text-neutral-400 hover:text-white uppercase tracking-wider transition-colors duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
