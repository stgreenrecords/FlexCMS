interface Props { data: Record<string, unknown> }

export function RelatedContent({ data }: Props) {
  const title = (data.title as string) ?? 'Related Content';
  const items = (data.items as string[]) ?? [];

  return (
    <section className="py-8 border-t border-neutral-800">
      <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-5">
        {title}
      </h3>
      {items.length > 0 ? (
        <ul className="flex flex-col gap-3 list-none m-0 p-0">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-neutral-300">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-600">No related content.</p>
      )}
    </section>
  );
}
