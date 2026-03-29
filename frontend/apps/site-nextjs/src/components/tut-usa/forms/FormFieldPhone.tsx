export interface FormFieldPhoneData {
  label: string;
  name: string;
  required: boolean;
  formatHint: string;
}

export function FormFieldPhone({ data }: { data: FormFieldPhoneData }) {
  return (
    <div className="space-y-2">
      <label className="font-label uppercase text-xs tracking-widest text-secondary block">
        {data.label}
        {data.required && <span className="text-error ml-1">*</span>}
      </label>
      <input
        type="tel"
        name={data.name}
        placeholder={data.formatHint || '+1 (555) 000-0000'}
        className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
      />
    </div>
  );
}
