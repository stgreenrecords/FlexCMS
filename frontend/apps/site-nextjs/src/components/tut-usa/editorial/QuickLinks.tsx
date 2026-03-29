export interface QuickLinksData {
  title: string;
  links: { label: string; url: string }[];
  iconMode: boolean;
}

interface Props {
  data: QuickLinksData;
}

export function QuickLinks({ data }: Props) {
  const { title, links, iconMode } = data;

  return (
    <nav aria-label={title} className="py-4">
      {title && (
        <h3 className="font-label tracking-widest uppercase text-xs text-on-surface-variant mb-3">
          {title}
        </h3>
      )}
      <ul className="flex flex-col gap-1">
        {links.map((link, i) => (
          <li key={i}>
            <a
              href={link.url}
              className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors py-1"
            >
              {iconMode && (
                <span className="text-primary text-xs shrink-0" aria-hidden="true">
                  →
                </span>
              )}
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
