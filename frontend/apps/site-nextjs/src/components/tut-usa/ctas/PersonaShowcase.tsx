export interface PersonaShowcaseData {
  title: string;
  personas: string[];
  layout: 'grid' | 'carousel';
}

export function PersonaShowcase({ data }: { data: PersonaShowcaseData }) {
  return (
    <section className="px-12 py-20">
      {data.title && (
        <h2 className="font-headline italic text-4xl text-on-surface mb-12">{data.title}</h2>
      )}
      {data.personas && data.personas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.personas.map((ref, i) => (
            <div key={i} className="bg-surface-container-low p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center font-label text-xs text-secondary">
                {i + 1}
              </div>
              <span className="font-body text-sm text-secondary">{ref}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
