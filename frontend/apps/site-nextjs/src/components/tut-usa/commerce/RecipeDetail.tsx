export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface NutrientRow {
  name: string;
  amount: string;
}

export interface RecipeDetailData {
  title: string;
  /** Hero image — 1200×600 */
  heroImage: string;
  ingredients: string[];
  steps: RecipeStep[];
  nutritionFacts: NutrientRow[];
}

export function RecipeDetail({ data }: { data: RecipeDetailData }) {
  return (
    <article className="bg-background">
      {data.heroImage && (
        <div className="w-full h-80 overflow-hidden">
          <img src={data.heroImage} alt={data.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="py-12 px-6 max-w-3xl mx-auto">
        <h1 className="font-headline italic text-4xl text-on-surface mb-10">{data.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-4">Ingredients</h2>
            {data.ingredients && (
              <ul className="space-y-2">
                {data.ingredients.map((ing, i) => (
                  <li key={i} className="font-body text-sm text-secondary flex items-start gap-2">
                    <span className="text-primary mt-1">—</span> {ing}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-4">Instructions</h2>
            {data.steps && (
              <ol className="space-y-4">
                {data.steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-headline text-2xl text-primary flex-shrink-0">{step.stepNumber || i + 1}</span>
                    <p className="font-body text-sm text-secondary leading-relaxed">{step.instruction}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
        {data.nutritionFacts && data.nutritionFacts.length > 0 && (
          <div className="mt-10">
            <h2 className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-4">Nutrition</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.nutritionFacts.map((n, i) => (
                <div key={i} className="bg-surface-container p-4 text-center">
                  <span className="font-headline text-xl text-on-surface block">{n.amount}</span>
                  <span className="font-label uppercase text-xs tracking-widest text-secondary">{n.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
