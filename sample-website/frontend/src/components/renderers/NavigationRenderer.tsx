import Link from 'next/link';
import type { WkndComponent } from '@/lib/flexcms';

interface Props {
  component: WkndComponent;
}

interface NavItem {
  title: string;
  url?: string;
  children?: NavItem[];
}

export function NavigationRenderer({ component }: Props) {
  const items = (component.data?.items as NavItem[]) ?? [];
  if (items.length === 0) return null;

  return (
    <nav aria-label="Main navigation">
      <ul className="flex items-center gap-6">
        {items.map((item, i) => (
          <li key={i} className="relative group">
            {item.url ? (
              <Link
                href={item.url}
                className="text-sm font-semibold uppercase tracking-wide hover:text-wknd-yellow transition-colors py-2 block"
              >
                {item.title}
              </Link>
            ) : (
              <span className="text-sm font-semibold uppercase tracking-wide py-2 block cursor-default">
                {item.title}
              </span>
            )}
            {item.children && item.children.length > 0 && (
              <ul className="hidden group-hover:block absolute top-full left-0 bg-white shadow-lg min-w-40 z-50">
                {item.children.map((child, j) => (
                  <li key={j}>
                    {child.url ? (
                      <Link
                        href={child.url}
                        className="block px-4 py-2 text-sm text-wknd-black hover:bg-wknd-gray transition-colors"
                      >
                        {child.title}
                      </Link>
                    ) : (
                      <span className="block px-4 py-2 text-sm text-wknd-black">{child.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
