export interface VinLookupData {
  title: string;
  inputLabel: string;
  validationPattern: string;
  submitAction: string;
}

export function VinLookup({ data }: { data: VinLookupData }) {
  return (
    <div className="bg-surface-container-low p-10">
      <span className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-6 block">
        Vehicle Diagnostics
      </span>
      <h2 className="font-headline text-3xl italic mb-8 text-on-surface">{data.title}</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="relative mb-12">
          <label className="font-label uppercase text-xs tracking-widest text-secondary mb-2 block">
            {data.inputLabel || 'Vehicle Identification Number'}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="WBA1234567890..."
              pattern={data.validationPattern || undefined}
              className="w-full text-xl font-body py-4 uppercase tracking-widest bg-transparent border-b border-outline-variant/40 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all pr-36"
            />
            <button
              type="submit"
              className="absolute right-0 bottom-2 bg-primary text-on-primary px-8 py-3 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all"
            >
              Verify Spec
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
