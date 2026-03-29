interface Props { data: Record<string, unknown> }

export function SkipLink({ data }: Props) {
  const label = (data.label as string) ?? 'Skip to main content';
  const targetId = (data.targetId as string) ?? 'main-content';

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:text-xs focus:font-medium focus:uppercase focus:tracking-widest focus:rounded focus:shadow-lg"
    >
      {label}
    </a>
  );
}
