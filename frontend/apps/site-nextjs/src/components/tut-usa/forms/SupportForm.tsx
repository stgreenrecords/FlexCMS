import type { FormFieldDef } from './LeadForm';

export interface SupportFormData {
  title: string;
  issueTypes: string[];
  fields: FormFieldDef[];
  caseRouting: 'auto' | 'manual' | 'tier1' | 'tier2';
}

export function SupportForm({ data }: { data: SupportFormData }) {
  return (
    <div className="bg-surface-container p-10">
      <h2 className="font-headline text-3xl italic mb-8 text-on-surface">{data.title}</h2>
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {data.issueTypes && data.issueTypes.length > 0 && (
          <div>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
              Issue Type <span className="text-error">*</span>
            </label>
            <select className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface focus:outline-none focus:border-primary transition-all appearance-none">
              <option value="">Select issue type</option>
              {data.issueTypes.map((t, i) => (
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
                {f.required && <span className="text-error ml-1">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  name={f.name}
                  placeholder={f.placeholder}
                  rows={4}
                  className="w-full bg-transparent border-b border-outline-variant/40 py-3 resize-none text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
                />
              ) : (
                <input
                  type="text"
                  name={f.name}
                  placeholder={f.placeholder}
                  className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
                />
              )}
            </div>
          ))}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Submit Case
        </button>
      </form>
    </div>
  );
}
