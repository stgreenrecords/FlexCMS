import type { FormFieldDef } from './LeadForm';

export interface ApplicationFormData {
  title: string;
  fields: FormFieldDef[];
  resumeUpload: boolean;
  submitAction: string;
}

export function ApplicationForm({ data }: { data: ApplicationFormData }) {
  return (
    <div className="bg-surface-container p-10">
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
                type={f.type === 'email' ? 'email' : 'text'}
                name={f.name}
                placeholder={f.placeholder}
                className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
              />
            </div>
          ))}
        {data.resumeUpload && (
          <div>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-4">
              Resume / CV <span className="text-error">*</span>
            </label>
            <label className="border border-dashed border-outline-variant/40 p-8 text-center block cursor-pointer hover:border-primary transition-all">
              <span className="font-label text-xs uppercase tracking-[0.2em] text-on-surface">
                Upload Resume (.pdf, .doc)
              </span>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" />
            </label>
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Submit Application
        </button>
      </form>
    </div>
  );
}
