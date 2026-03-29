interface LinkItem { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function ButtonGroup({ data }: Props) {
  const buttons = (data.buttons as LinkItem[]) ?? [];
  const alignment = (data.alignment as string) ?? 'left';

  const alignClass =
    alignment === 'center'
      ? 'justify-center'
      : alignment === 'right'
      ? 'justify-end'
      : 'justify-start';

  return (
    <div className={`flex flex-wrap items-center gap-3 ${alignClass}`}>
      {buttons.map((btn, i) => (
        <a
          key={i}
          href={btn.url}
          className="inline-block px-6 py-2 text-xs font-medium uppercase tracking-widest border border-white text-white hover:bg-white hover:text-black transition-colors duration-200"
        >
          {btn.label}
        </a>
      ))}
    </div>
  );
}
