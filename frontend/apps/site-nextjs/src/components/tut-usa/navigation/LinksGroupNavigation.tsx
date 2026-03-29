interface LinkItem { label: string; url: string }
interface FeaturedLink { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function LinksGroupNavigation({ data }: Props) {
  const groupTitle = (data.groupTitle as string) ?? '';
  const links = (data.links as LinkItem[]) ?? [];
  const featuredLink = (data.featuredLink as FeaturedLink | undefined) ?? null;

  return (
    <div className="py-4">
      {groupTitle && (
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">
          {groupTitle}
        </h3>
      )}
      <ul className="flex flex-col gap-2 list-none m-0 p-0">
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
      {featuredLink && (
        <a
          href={featuredLink.url}
          className="inline-block mt-4 text-xs text-white border-b border-white pb-px uppercase tracking-widest hover:border-neutral-400 hover:text-neutral-400 transition-colors duration-200"
        >
          {featuredLink.label} &rarr;
        </a>
      )}
    </div>
  );
}
