import type { AccountField } from './RegistrationForm';

export interface ProfileEditorData {
  title: string;
  fields: AccountField[];
  submitAction: string;
  successMessage: string;
}

export function ProfileEditor({ data }: { data: ProfileEditorData }) {
  return (
    <section className="bg-surface-container p-10 max-w-lg">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {data.fields && data.fields.map((f, i) => (
          <div key={i}>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-2">{f.label}</label>
            <input
              type={f.type === 'email' ? 'email' : 'text'}
              name={f.name}
              required={f.required}
              className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface font-body text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>
        ))}
        <button
          type="submit"
          className="bg-primary text-on-primary px-8 py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Save Changes
        </button>
      </form>
    </section>
  );
}
