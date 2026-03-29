export interface FeaturedContentData {
  title: string;
  items: string[];
  layout: 'grid' | 'list' | 'bento';
}

export function FeaturedContent({ data }: { data: FeaturedContentData }) {
  const gridClass =
    data.layout === 'list'
      ? 'flex flex-col gap-4'
      : data.layout === 'bento'
      ? 'grid grid-cols-1 md:grid-cols-3 gap-8'
      : 'grid grid-cols-1 md:grid-cols-2 gap-6';

  return (
    <section className="px-12 py-20">
      {data.title && (
        <h2 className="font-headline italic text-4xl mb-12 text-on-surface">{data.title}</h2>
      )}
      {data.items && data.items.length > 0 && (
        <div className={gridClass}>
          {data.items.map((ref, i) => (
            <div key={i} className="bg-surface-container-low p-8 min-h-[200px] flex items-center">
              <span className="font-body text-sm text-secondary">{ref}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
