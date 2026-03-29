interface LinkItem { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function LinksGroupFooter({ data }: Props) {
  const groupTitle = (data.groupTitle as string) ?? '';
  const links = (data.links as LinkItem[]) ?? [];
  const audienceLabel = (data.audienceLabel as string) ?? '';

  return (
    <div className="py-2">
      {audienceLabel && (
        <p className="text-xs text-neutral-600 uppercase tracking-widest mb-1">{audienceLabel}</p>
      )}
      {groupTitle && (
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">
          {groupTitle}
        </h3>
      )}
      <ul className="flex flex-col gap-2 list-none m-0 p-0">
        {links.map((link, i) => (
          <li key={i}>
            <a
              href={link.url}
              className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
