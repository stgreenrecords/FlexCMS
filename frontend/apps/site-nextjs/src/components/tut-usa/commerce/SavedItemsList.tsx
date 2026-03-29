export interface SavedItem {
  productName: string;
  image: string;
  price: number;
  url: string;
}

export interface SavedItemsListData {
  title: string;
  items: SavedItem[];
  emptyStateMessage: string;
}

export function SavedItemsList({ data }: { data: SavedItemsListData }) {
  const isEmpty = !data.items || data.items.length === 0;
  return (
    <section className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      {isEmpty ? (
        <p className="font-body text-sm text-secondary text-center py-12">
          {data.emptyStateMessage || 'No saved items yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {data.items.map((item, i) => (
            <div key={i} className="bg-surface-container-low border border-outline-variant/30 p-4">
              {item.image && <img src={item.image} alt={item.productName} className="w-full h-40 object-cover mb-4" />}
              <span className="font-label text-xs uppercase tracking-widest text-on-surface block mb-1">{item.productName}</span>
              <div className="flex items-center justify-between">
                <span className="font-headline text-lg text-primary">
                  {typeof item.price === 'number' ? `$${item.price.toLocaleString()}` : item.price}
                </span>
                {item.url && (
                  <a href={item.url} className="font-label text-xs text-primary hover:underline uppercase tracking-widest">View</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
