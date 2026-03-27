interface FooterColumn {
  heading: string;
  links: Array<{ label: string; url: string }>;
}

interface SocialLink {
  platform: string;
  url: string;
}

/** tut/footer-links — multi-column footer with links and social media. */
export function FooterLinks({ data }: { data: Record<string, unknown> }) {
  const columns = (data.columns as FooterColumn[] | undefined) ?? [];
  const copyrightText = (data.copyrightText as string | undefined) ?? `© ${new Date().getFullYear()} TUT Automobiles`;
  const socialLinks = (data.socialLinks as SocialLink[] | undefined) ?? [];

  return (
    <footer className="bg-gray-950 text-gray-400 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        {columns.length > 0 && (
          <div className={`grid grid-cols-2 md:grid-cols-${Math.min(columns.length, 4)} gap-10 mb-16`}>
            {columns.map((col, i) => (
              <div key={i}>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-6">{col.heading}</h4>
                <ul className="space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href={link.url} className="text-sm hover:text-white transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">{copyrightText}</p>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-6">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.url}
                  className="text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
