export interface MenuCategory {
  categoryName: string;
  items: { itemName: string; description: string; price: number; dietaryTags?: string[] }[];
}

export interface MenuListData {
  title: string;
  categories: MenuCategory[];
  showPrices: boolean;
}

export function MenuList({ data }: { data: MenuListData }) {
  return (
    <section className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-10">{data.title}</h2>
      {data.categories && data.categories.map((cat, i) => (
        <div key={i} className="mb-10">
          <h3 className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-4">{cat.categoryName}</h3>
          <div className="space-y-4">
            {cat.items?.map((item, j) => (
              <div key={j} className="flex items-start justify-between border-b border-outline-variant/10 pb-4">
                <div>
                  <span className="font-body text-sm text-on-surface block">{item.itemName}</span>
                  {item.description && <span className="font-body text-xs text-secondary">{item.description}</span>}
                  {item.dietaryTags && item.dietaryTags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {item.dietaryTags.map((tag, k) => (
                        <span key={k} className="font-label text-xs border border-outline-variant/30 text-secondary px-1.5 py-0.5">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                {data.showPrices && item.price !== undefined && (
                  <span className="font-headline text-base text-primary flex-shrink-0 ml-6">${item.price.toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
