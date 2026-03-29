interface LinkItem { label: string; url: string }
interface MenuSection { title: string; links: LinkItem[] }
interface Props { data: Record<string, unknown> }

export function MegaMenu({ data }: Props) {
  const sections = (data.sections as MenuSection[]) ?? [];
  const featuredLinks = (data.featuredLinks as LinkItem[]) ?? [];
  const promoCard = (data.promoCard as string) ?? '';

  return (
    <div className="absolute left-0 right-0 bg-black border-t border-neutral-800 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${Math.max(sections.length, 1)}, minmax(0, 1fr))` }}>
          {sections.map((section, i) => (
            <div key={i}>
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">
                {section.title}
              </h4>
              <ul className="flex flex-col gap-3 list-none m-0 p-0">
                {(section.links ?? []).map((link, j) => (
                  <li key={j}>
                    <a
                      href={link.url}
                      className="text-sm text-neutral-300 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {(featuredLinks.length > 0 || promoCard) && (
          <div className="mt-8 pt-8 border-t border-neutral-800 flex items-center gap-6 flex-wrap">
            {featuredLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                className="text-xs text-white border-b border-white pb-px uppercase tracking-widest hover:border-neutral-400 hover:text-neutral-400 transition-colors duration-200"
              >
                {link.label} &rarr;
              </a>
            ))}
            {promoCard && (
              <span className="ml-auto text-xs text-neutral-500">{promoCard}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
