export interface FactBoxData {
  title: string;
  text: string;
  /** Fact box icon — 48×48 */
  icon: string;
  variant: 'default' | 'highlight' | 'warning';
}

const variantMap: Record<FactBoxData['variant'], string> = {
  default: 'bg-surface-container-low border-outline-variant/20',
  highlight: 'bg-surface-container-low border-primary/40',
  warning: 'bg-surface-container-low border-amber-500/40',
};

const iconWrapperMap: Record<FactBoxData['variant'], string> = {
  default: 'text-on-surface-variant',
  highlight: 'text-primary',
  warning: 'text-amber-400',
};

interface Props {
  data: FactBoxData;
}

export function FactBox({ data }: Props) {
  const { title, text, icon, variant } = data;

  return (
    <aside
      className={`rounded-xl border ${variantMap[variant]} p-6 flex gap-4 my-6`}
    >
      {icon && (
        <img
          src={icon}
          alt=""
          width={48}
          height={48}
          className={`shrink-0 ${iconWrapperMap[variant]}`}
          aria-hidden="true"
        />
      )}
      <div className="flex flex-col gap-2">
        {title && (
          <h4 className="font-label tracking-widest uppercase text-xs text-on-surface">
            {title}
          </h4>
        )}
        <p className="text-sm text-on-surface-variant leading-relaxed">{text}</p>
      </div>
    </aside>
  );
}
