interface Props { data: Record<string, unknown> }

export function TutUsaSiteMap({ data }: Props) {
  const title = (data.title as string) ?? 'Site Map';
  const rootPages = (data.rootPages as string[]) ?? [];

  return (
    <section className="py-16 px-8 bg-black text-white">
      <h1 className="text-3xl font-extralight tracking-widest uppercase mb-10">{title}</h1>
      {rootPages.length > 0 ? (
        <ul className="flex flex-col gap-3 list-none m-0 p-0">
          {rootPages.map((page, i) => (
            <li key={i}>
              <span className="text-sm text-neutral-300">{page}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-600">No pages to display.</p>
      )}
    </section>
  );
}
