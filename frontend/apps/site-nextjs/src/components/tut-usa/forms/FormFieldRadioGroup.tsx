export interface FormFieldRadioGroupData {
  label: string;
  name: string;
  required: boolean;
  options: string[];
}

export function FormFieldRadioGroup({ data }: { data: FormFieldRadioGroupData }) {
  return (
    <fieldset>
      <legend className="font-label uppercase text-xs tracking-widest text-secondary block mb-4">
        {data.label}
        {data.required && <span className="text-error ml-1">*</span>}
      </legend>
      <div className="space-y-3">
        {data.options &&
          data.options.map((opt, i) => (
            <label
              key={i}
              className="flex items-center gap-4 p-4 border border-outline-variant/20 cursor-pointer hover:bg-surface-variant transition-colors"
            >
              <input type="radio" name={data.name} value={opt} className="w-4 h-4 text-primary" />
              <span className="font-label text-xs uppercase tracking-widest text-on-surface">
                {opt}
              </span>
            </label>
          ))}
      </div>
    </fieldset>
  );
}
