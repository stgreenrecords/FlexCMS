import type { FormFieldDef } from './LeadForm';

export interface CommentFormData {
  title: string;
  fields: FormFieldDef[];
  moderationRequired: boolean;
}

export function CommentForm({ data }: { data: CommentFormData }) {
  return (
    <div className="bg-surface-container p-8">
      <h3 className="font-headline italic text-2xl text-on-surface mb-6">{data.title}</h3>
      {data.moderationRequired && (
        <p className="font-label text-xs text-secondary uppercase tracking-widest mb-6">
          Comments are moderated before appearing.
        </p>
      )}
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {data.fields &&
          data.fields.map((f, i) => (
            <div key={i}>
              <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
                {f.label}
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
          className="bg-primary text-on-primary px-8 py-3 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Post Comment
        </button>
      </form>
    </div>
  );
}
