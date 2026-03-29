export interface FormFieldSelectData {
  label: string;
  name: string;
  required: boolean;
  options: string[];
}

export function FormFieldSelect({ data }: { data: FormFieldSelectData }) {
  return (
    <div className="space-y-2">
      <label className="font-label uppercase text-xs tracking-widest text-secondary block">
        {data.label}
        {data.required && <span className="text-error ml-1">*</span>}
      </label>
      <select
        name={data.name}
        className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface focus:outline-none focus:border-primary transition-all appearance-none"
      >
        <option value="">Select…</option>
        {data.options &&
          data.options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
      </select>
    </div>
  );
}
