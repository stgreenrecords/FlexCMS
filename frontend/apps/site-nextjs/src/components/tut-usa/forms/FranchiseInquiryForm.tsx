import type { FormFieldDef } from './LeadForm';

export interface FranchiseInquiryFormData {
  title: string;
  fields: FormFieldDef[];
  territoryOptions: string[];
  submitAction: string;
}

export function FranchiseInquiryForm({ data }: { data: FranchiseInquiryFormData }) {
  return (
    <div className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {data.territoryOptions && data.territoryOptions.length > 0 && (
          <div>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
              Preferred Territory
            </label>
            <select className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface focus:outline-none focus:border-primary transition-all appearance-none">
              <option value="">Select territory</option>
              {data.territoryOptions.map((t, i) => (
                <option key={i} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
        {data.fields &&
          data.fields.map((f, i) => (
            <div key={i}>
              <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
                {f.label}
              </label>
              <input
                type={f.type === 'email' ? 'email' : 'text'}
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
          Submit Inquiry
        </button>
      </form>
    </div>
  );
}
