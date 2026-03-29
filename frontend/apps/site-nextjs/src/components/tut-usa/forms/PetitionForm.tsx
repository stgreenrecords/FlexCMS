import type { FormFieldDef } from './LeadForm';

export interface PetitionFormData {
  title: string;
  description: string;
  fields: FormFieldDef[];
  submitAction: string;
}

export function PetitionForm({ data }: { data: PetitionFormData }) {
  return (
    <section className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-4">{data.title}</h2>
      {data.description && (
        <p className="font-body text-secondary mb-8">{data.description}</p>
      )}
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
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
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Sign Petition
        </button>
      </form>
    </section>
  );
}
