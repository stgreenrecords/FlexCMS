export interface FormFieldEmailData {
  label: string;
  name: string;
  required: boolean;
  placeholder: string;
}

export function FormFieldEmail({ data }: { data: FormFieldEmailData }) {
  return (
    <div className="space-y-2">
      <label className="font-label uppercase text-xs tracking-widest text-secondary block">
        {data.label}
        {data.required && <span className="text-error ml-1">*</span>}
      </label>
      <input
        type="email"
        name={data.name}
        placeholder={data.placeholder}
        className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
      />
    </div>
  );
}
