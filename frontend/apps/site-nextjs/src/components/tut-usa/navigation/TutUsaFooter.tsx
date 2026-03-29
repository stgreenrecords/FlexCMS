interface LinkItem { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function TutUsaFooter({ data }: Props) {
  const logo = (data.logo as string) ?? 'TUT';
  const copyrightText = (data.copyrightText as string) ?? `© ${new Date().getFullYear()} TUT Motors USA. All rights reserved.`;
  const socialLinks = (data.socialLinks as LinkItem[]) ?? [];
  const legalLinks = (data.legalLinks as LinkItem[]) ?? [];
  const footerLinkGroups = (data.footerLinkGroups as unknown[]) ?? [];

  const defaultGroups = [
    { title: 'Vehicles', links: [] as LinkItem[] },
    { title: 'Ownership', links: [] as LinkItem[] },
    { title: 'Innovation', links: [] as LinkItem[] },
    { title: 'Company', links: [] as LinkItem[] },
  ];

  const groups = footerLinkGroups.length > 0
    ? footerLinkGroups.map((g) => {
        const group = g as Record<string, unknown>;
        return {
          title: (group.title as string) ?? 'Footer Links',
          links: (group.links as LinkItem[]) ?? [],
        };
      })
    : defaultGroups;

  return (
    <footer className="bg-black text-white border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Brand */}
        <div className="mb-12">
          <span className="text-2xl font-extralight tracking-[0.4em] uppercase">{logo}</span>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {groups.map((group, i) => (
            <div key={i}>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-4">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-2 list-none m-0 p-0">
                {group.links.map((link, j) => (
                  <li key={j}>
                    <a
                      href={link.url}
                      className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                {group.links.length === 0 && (
                  <li className="text-sm text-neutral-700">Footer links</li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-6 mb-8">
            {socialLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                className="text-xs text-neutral-400 hover:text-white uppercase tracking-widest transition-colors duration-200"
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-neutral-800">
          <p className="text-xs text-neutral-600">{copyrightText}</p>
          {legalLinks.length > 0 && (
            <ul className="flex items-center gap-4 list-none m-0 p-0">
              {legalLinks.map((link, i) => (
                <li key={i}>
                  <a
                    href={link.url}
                    className="text-xs text-neutral-500 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
