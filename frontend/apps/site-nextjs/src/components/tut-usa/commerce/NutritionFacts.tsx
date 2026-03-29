export interface Nutrient {
  name: string;
  amount: string;
  dailyValue?: string;
}

export interface NutritionFactsData {
  servingSize: string;
  calories: number;
  nutrients: Nutrient[];
  allergens: string[];
}

export function NutritionFacts({ data }: { data: NutritionFactsData }) {
  return (
    <div className="bg-surface-container border-2 border-on-surface p-6 max-w-xs font-body">
      <h3 className="font-headline text-2xl text-on-surface mb-1">Nutrition Facts</h3>
      <p className="font-label text-xs text-secondary mb-2">Serving size: {data.servingSize}</p>
      <div className="border-t-8 border-on-surface my-2" />
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-label text-xs uppercase tracking-widest text-secondary">Calories</span>
        <span className="font-headline text-3xl text-on-surface">{data.calories}</span>
      </div>
      <div className="border-t-4 border-on-surface my-2" />
      {data.nutrients && data.nutrients.map((n, i) => (
        <div key={i} className="flex justify-between items-center border-b border-outline-variant/20 py-1">
          <span className="font-body text-xs text-on-surface">{n.name}</span>
          <div className="text-right">
            <span className="font-body text-xs text-on-surface">{n.amount}</span>
            {n.dailyValue && (
              <span className="font-body text-xs text-secondary ml-2">{n.dailyValue}</span>
            )}
          </div>
        </div>
      ))}
      {data.allergens && data.allergens.length > 0 && (
        <div className="mt-4">
          <span className="font-label text-xs uppercase tracking-widest text-secondary block mb-1">Contains:</span>
          <p className="font-body text-xs text-on-surface">{data.allergens.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
