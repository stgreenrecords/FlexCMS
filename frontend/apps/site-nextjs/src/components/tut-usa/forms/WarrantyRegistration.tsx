import type { FormFieldDef } from './LeadForm';

export interface WarrantyRegistrationData {
  title: string;
  fields: FormFieldDef[];
  productLookup: boolean;
  submitAction: string;
}

export function WarrantyRegistration({ data }: { data: WarrantyRegistrationData }) {
  return (
    <div className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {data.productLookup && (
          <div>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
              Product / Serial Number
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter serial or model number"
                className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all pr-24"
              />
              <button
                type="button"
                className="absolute right-0 bottom-2 bg-primary text-on-primary px-4 py-2 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all"
              >
                Lookup
              </button>
            </div>
          </div>
        )}
        {data.fields &&
          data.fields.map((f, i) => (
            <div key={i}>
              <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
                {f.label}
              </label>
              <input
                type={f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : 'text'}
                name={f.name}
                placeholder={f.placeholder}
                className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
              />
            </div>
          ))}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Register Warranty
        </button>
      </form>
    </div>
  );
}
