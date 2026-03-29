export interface RecipeCardData {
  title: string;
  description: string;
  /** Recipe image — 600×400 */
  image: string;
  prepTime: number;
  cta: { label: string; url: string };
}

export function RecipeCard({ data }: { data: RecipeCardData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 flex flex-col">
      {data.image && (
        <div className="overflow-hidden aspect-video">
          <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6 flex-1 flex flex-col">
        {data.prepTime > 0 && (
          <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-2">{data.prepTime} min</span>
        )}
        <h3 className="font-headline italic text-xl text-on-surface mb-3">{data.title}</h3>
        {data.description && (
          <p className="font-body text-sm text-secondary mb-4 flex-1">{data.description}</p>
        )}
        {data.cta?.label && (
          <a href={data.cta.url} className="font-label uppercase text-xs tracking-widest text-primary hover:underline">
            {data.cta.label}
          </a>
        )}
      </div>
    </div>
  );
}
