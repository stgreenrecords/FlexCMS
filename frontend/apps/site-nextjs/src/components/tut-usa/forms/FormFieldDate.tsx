export interface FormFieldDateData {
  label: string;
  name: string;
  required: boolean;
  minDate: string;
  maxDate: string;
}

export function FormFieldDate({ data }: { data: FormFieldDateData }) {
  return (
    <div className="space-y-2">
      <label className="font-label uppercase text-xs tracking-widest text-secondary block">
        {data.label}
        {data.required && <span className="text-error ml-1">*</span>}
      </label>
      <input
        type="date"
        name={data.name}
        min={data.minDate || undefined}
        max={data.maxDate || undefined}
        className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface focus:outline-none focus:border-primary transition-all"
      />
    </div>
  );
}
