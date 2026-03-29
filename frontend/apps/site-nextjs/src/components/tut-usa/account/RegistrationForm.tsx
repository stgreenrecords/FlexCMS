export interface AccountField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}

export interface RegistrationFormData {
  title: string;
  fields: AccountField[];
  submitAction: string;
  successRedirect: string;
}

export function RegistrationForm({ data }: { data: RegistrationFormData }) {
  return (
    <div className="bg-surface-container p-10 max-w-lg w-full">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {data.fields && data.fields.map((f, i) => (
          <div key={i}>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-2">
              {f.label}{f.required && <span className="text-error ml-1">*</span>}
            </label>
            <input
              type={f.type === 'email' ? 'email' : f.type === 'password' ? 'password' : 'text'}
              name={f.name}
              required={f.required}
              className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary font-body text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Create Account
        </button>
      </form>
    </div>
  );
}
