interface LinkItem { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function TutUsaBreadcrumb({ data }: Props) {
  const items = (data.items as LinkItem[]) ?? [];
  const showHome = (data.showHome as boolean) ?? true;

  const crumbs: LinkItem[] = showHome
    ? [{ label: 'Home', url: '/' }, ...items]
    : items;

  return (
    <nav aria-label="breadcrumb" className="w-full py-3">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-neutral-400 uppercase tracking-widest">
        {crumbs.map((crumb, index) => (
          <li key={index} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-neutral-600 mx-1" aria-hidden="true">/</span>
            )}
            {index < crumbs.length - 1 ? (
              <a
                href={crumb.url}
                className="hover:text-white transition-colors duration-200"
              >
                {crumb.label}
              </a>
            ) : (
              <span className="text-white" aria-current="page">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
