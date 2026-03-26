import Link from 'next/link';
import type { WkndComponent } from '@/lib/flexcms';

interface Props {
  component: WkndComponent;
}

interface BreadcrumbItem {
  title: string;
  url?: string;
}

export function BreadcrumbRenderer({ component }: Props) {
  const items = (component.data?.items as BreadcrumbItem[]) ?? [];
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="px-4 py-3 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>/</span>}
            {item.url ? (
              <Link href={item.url} className="hover:text-wknd-black transition-colors">
                {item.title}
              </Link>
            ) : (
              <span className="text-wknd-black font-medium">{item.title}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
