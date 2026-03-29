import type { FormFieldDef } from './LeadForm';

export interface ReturnsFormData {
  title: string;
  fields: FormFieldDef[];
  returnReasons: string[];
  submitAction: string;
}

export function ReturnsForm({ data }: { data: ReturnsFormData }) {
  return (
    <div className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {data.returnReasons && data.returnReasons.length > 0 && (
          <div>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
              Reason for Return <span className="text-error">*</span>
            </label>
            <select className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface focus:outline-none focus:border-primary transition-all appearance-none">
              <option value="">Select reason</option>
              {data.returnReasons.map((r, i) => (
                <option key={i} value={r}>
                  {r}
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
          Submit Return
        </button>
      </form>
    </div>
  );
}
