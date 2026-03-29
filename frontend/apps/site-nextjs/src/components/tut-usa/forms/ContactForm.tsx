import type { FormFieldDef } from './LeadForm';

export interface ContactFormData {
  title: string;
  description: string;
  fields: FormFieldDef[];
  recipientGroup: string;
  spamProtection: boolean;
}

export function ContactForm({ data }: { data: ContactFormData }) {
  return (
    <div className="bg-surface-container p-10">
      <h2 className="font-headline text-3xl italic mb-4 text-on-surface">{data.title}</h2>
      {data.description && (
        <p className="font-body text-sm text-secondary mb-8">{data.description}</p>
      )}
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
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
                  type={f.type === 'email' ? 'email' : 'text'}
                  name={f.name}
                  placeholder={f.placeholder}
                  className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
                />
              )}
            </div>
          ))}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-[0.2em] font-bold hover:bg-primary-fixed transition-all"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
