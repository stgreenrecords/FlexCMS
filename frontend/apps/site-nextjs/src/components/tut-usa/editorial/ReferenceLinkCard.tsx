export interface ReferenceLinkCardData {
  title: string;
  description: string;
  url: string;
  /** Icon — 48×48 */
  icon: string;
}

interface Props {
  data: ReferenceLinkCardData;
}

export function ReferenceLinkCard({ data }: Props) {
  const { title, description, url, icon } = data;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 items-start bg-surface-container-low border border-outline-variant/20 rounded-xl p-5 hover:border-primary/40 transition-colors group"
    >
      {icon && (
        <img
          src={icon}
          alt=""
          width={48}
          height={48}
          aria-hidden="true"
          className="shrink-0 w-10 h-10 object-contain"
        />
      )}
      <div className="flex flex-col gap-1">
        <h4 className="font-label tracking-widest uppercase text-sm text-on-surface group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p>
      </div>
    </a>
  );
}
