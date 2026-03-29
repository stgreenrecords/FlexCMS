interface Props { data: Record<string, unknown> }

export function CategoryGrid({ data }: Props) {
  const title = (data.title as string) ?? '';
  const categories = (data.categories as unknown[]) ?? [];
  const columns = (data.columns as number) ?? 3;

  return (
    <section className="py-12">
      {title && (
        <h2 className="text-2xl font-extralight text-white tracking-widest uppercase mb-8">
          {title}
        </h2>
      )}
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {categories.length > 0
          ? categories.map((_, i) => (
              <div
                key={i}
                className="bg-neutral-950 border border-neutral-800 aspect-video flex items-center justify-center"
              >
                <span className="text-xs text-neutral-600 uppercase tracking-widest">
                  Category {i + 1}
                </span>
              </div>
            ))
          : Array.from({ length: columns }).map((_, i) => (
              <div
                key={i}
                className="bg-neutral-950 border border-neutral-800 border-dashed aspect-video flex items-center justify-center"
              >
                <span className="text-xs text-neutral-700 uppercase tracking-widest">Slot</span>
              </div>
            ))}
      </div>
    </section>
  );
}
