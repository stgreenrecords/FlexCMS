interface Props { data: Record<string, unknown> }

export function TextLink({ data }: Props) {
  const label = (data.label as string) ?? '';
  const url = (data.url as string) ?? '#';

  return (
    <a
      href={url}
      className="text-sm text-neutral-300 hover:text-white underline-offset-2 hover:underline transition-colors duration-200"
    >
      {label}
    </a>
  );
}
