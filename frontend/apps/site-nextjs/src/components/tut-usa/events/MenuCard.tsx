export interface MenuCardData {
  itemName: string;
  description: string;
  price: number;
  dietaryTags: string[];
  /** Menu item image — 400×300 */
  image: string;
}

export function MenuCard({ data }: { data: MenuCardData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 flex gap-4 p-4">
      {data.image && (
        <div className="w-24 h-20 flex-shrink-0 overflow-hidden">
          <img src={data.image} alt={data.itemName} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-headline italic text-lg text-on-surface">{data.itemName}</h4>
          {data.price !== undefined && (
            <span className="font-headline text-lg text-primary flex-shrink-0 ml-4">
              {typeof data.price === 'number' ? `$${data.price.toFixed(2)}` : data.price}
            </span>
          )}
        </div>
        {data.description && <p className="font-body text-xs text-secondary mb-2">{data.description}</p>}
        {data.dietaryTags && data.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.dietaryTags.map((tag, i) => (
              <span key={i} className="font-label uppercase text-xs tracking-widest border border-outline-variant/30 text-secondary px-2 py-0.5">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
