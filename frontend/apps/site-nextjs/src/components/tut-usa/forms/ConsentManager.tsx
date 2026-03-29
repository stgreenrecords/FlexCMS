export interface ConsentCategory {
  name: string;
  description: string;
  required?: boolean;
}

export interface ConsentManagerData {
  title: string;
  categories: ConsentCategory[];
  saveAction: string;
  defaultState: 'all-on' | 'all-off' | 'required-only';
}

export function ConsentManager({ data }: { data: ConsentManagerData }) {
  return (
    <div className="bg-surface-container-low p-12 border-l-4 border-primary max-w-3xl">
      <span className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-6 block">
        Legal Governance
      </span>
      <h2 className="font-headline text-4xl italic mb-10 text-on-surface">{data.title}</h2>
      <div className="space-y-8 mb-12">
        {data.categories &&
          data.categories.map((cat, i) => (
            <div key={i} className="flex gap-6 items-start">
              <div className="shrink-0 pt-0.5">
                <input
                  type="checkbox"
                  defaultChecked={cat.required || data.defaultState === 'all-on'}
                  disabled={cat.required}
                  className="w-5 h-5 bg-transparent border-outline-variant text-primary focus:ring-0"
                />
              </div>
              <div>
                <h4 className="font-label text-xs uppercase tracking-widest font-bold mb-2 text-on-surface">
                  {cat.name}
                  {cat.required && (
                    <span className="ml-2 text-secondary font-normal">(Required)</span>
                  )}
                </h4>
                <p className="font-body text-sm text-secondary leading-relaxed">{cat.description}</p>
              </div>
            </div>
          ))}
      </div>
      <div className="flex flex-wrap gap-6">
        <button
          className="bg-primary text-on-primary px-10 py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
          onClick={(e) => e.preventDefault()}
        >
          Save Preferences
        </button>
        <button
          className="border border-outline-variant/30 text-on-surface px-10 py-4 font-label uppercase text-xs tracking-widest hover:bg-surface-variant transition-all"
          onClick={(e) => e.preventDefault()}
        >
          Withdraw All Consent
        </button>
      </div>
    </div>
  );
}
