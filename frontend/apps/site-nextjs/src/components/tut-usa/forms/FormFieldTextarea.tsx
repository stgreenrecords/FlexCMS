export interface FormFieldTextareaData {
  label: string;
  name: string;
  required: boolean;
  placeholder: string;
  maxLength: number;
}

export function FormFieldTextarea({ data }: { data: FormFieldTextareaData }) {
  return (
    <div className="space-y-2">
      <label className="font-label uppercase text-xs tracking-widest text-secondary block">
        {data.label}
        {data.required && <span className="text-error ml-1">*</span>}
      </label>
      <textarea
        name={data.name}
        placeholder={data.placeholder}
        maxLength={data.maxLength || undefined}
        rows={4}
        className="w-full bg-transparent border-b border-outline-variant/40 py-3 resize-none text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
      />
    </div>
  );
}
