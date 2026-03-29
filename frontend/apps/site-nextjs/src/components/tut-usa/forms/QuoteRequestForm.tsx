import type { FormFieldDef } from './LeadForm';

export interface QuoteRequestFormData {
  title: string;
  fields: FormFieldDef[];
  productType: string;
  submitAction: string;
}

export function QuoteRequestForm({ data }: { data: QuoteRequestFormData }) {
  return (
    <div className="bg-surface-container p-10">
      {data.productType && (
        <span className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-4 block">
          {data.productType}
        </span>
      )}
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {data.fields &&
          data.fields.map((f, i) => (
            <div key={i}>
              <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
                {f.label}
                {f.required && <span className="text-error ml-1">*</span>}
              </label>
              <input
                type="text"
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
          Request Quote
        </button>
      </form>
    </div>
  );
}
