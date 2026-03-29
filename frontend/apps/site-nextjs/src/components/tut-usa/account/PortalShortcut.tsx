export interface PortalShortcutData {
  title: string;
  description: string;
  url: string;
  /** Icon image — 48×48 */
  icon: string;
}

export function PortalShortcut({ data }: { data: PortalShortcutData }) {
  return (
    <a
      href={data.url}
      className="bg-surface-container border border-outline-variant/30 p-6 flex items-start gap-4 hover:border-primary transition-all block"
    >
      {data.icon && <img src={data.icon} alt="" className="w-10 h-10 object-contain flex-shrink-0" />}
      <div>
        <span className="font-label uppercase text-xs tracking-widest text-on-surface block mb-1">{data.title}</span>
        {data.description && (
          <span className="font-body text-xs text-secondary">{data.description}</span>
        )}
      </div>
    </a>
  );
}
