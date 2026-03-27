/** tut/breadcrumb — page breadcrumb from CMS-provided items or current URL. */
export function Breadcrumb({ data }: { data: Record<string, unknown> }) {
  const rawItems = data.items as Array<{ label: string; url: string }> | undefined;

  if (!rawItems || rawItems.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="px-6 py-4 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center gap-2 text-xs text-gray-500">
          {rawItems.map((item, idx) => {
            const isLast = idx === rawItems.length - 1;
            return (
              <li key={idx} className="flex items-center gap-2">
                {isLast ? (
                  <span className="font-semibold text-gray-900">{item.label}</span>
                ) : (
                  <>
                    <a href={item.url} className="hover:text-gray-900 transition-colors">
                      {item.label}
                    </a>
                    <span aria-hidden>›</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
