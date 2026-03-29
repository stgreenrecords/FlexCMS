export interface FormFieldDef {
  type: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface LeadFormData {
  title: string;
  description: string;
  fields: FormFieldDef[];
  submitAction: string;
  successRedirect: string;
}

export function LeadForm({ data }: { data: LeadFormData }) {
  return (
    <div className="bg-surface-container-high p-10 flex flex-col">
      <span className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-6 block">
        Direct Inquiry
      </span>
      <h2 className="font-headline text-3xl italic mb-4 leading-snug text-on-surface">
        {data.title}
      </h2>
      {data.description && (
        <p className="font-body text-sm text-secondary mb-8">{data.description}</p>
      )}
      <form className="space-y-8 flex-grow" onSubmit={(e) => e.preventDefault()}>
        {data.fields &&
          data.fields.map((f, i) => (
            <div key={i}>
              <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
                {f.label}
                {f.required && <span className="text-error ml-1">*</span>}
              </label>
              <input
                type={f.type === 'email' ? 'email' : 'text'}
                name={f.name}
                placeholder={f.placeholder}
                className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
              />
            </div>
          ))}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-[0.2em] font-bold hover:bg-primary-fixed transition-all"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
