interface LinkItem { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function AnchorLinks({ data }: Props) {
  const links = (data.links as LinkItem[]) ?? [];
  const orientation = (data.orientation as string) ?? 'horizontal';

  const flexClass = orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap';

  return (
    <nav aria-label="Anchor links" className="py-4">
      <ul className={`flex ${flexClass} gap-4 list-none m-0 p-0`}>
        {links.map((link, i) => (
          <li key={i}>
            <a
              href={link.url}
              className="text-xs text-neutral-400 hover:text-white uppercase tracking-widest transition-colors duration-200 border-b border-transparent hover:border-white pb-px"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
