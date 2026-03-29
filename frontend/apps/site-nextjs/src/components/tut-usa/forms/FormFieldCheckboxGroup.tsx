export interface FormFieldCheckboxGroupData {
  label: string;
  name: string;
  required: boolean;
  options: string[];
}

export function FormFieldCheckboxGroup({ data }: { data: FormFieldCheckboxGroupData }) {
  return (
    <fieldset>
      <legend className="font-label uppercase text-xs tracking-widest text-secondary block mb-4">
        {data.label}
        {data.required && <span className="text-error ml-1">*</span>}
      </legend>
      <div className="space-y-3">
        {data.options &&
          data.options.map((opt, i) => (
            <label key={i} className="flex items-center gap-4 cursor-pointer">
              <input
                type="checkbox"
                name={data.name}
                value={opt}
                className="w-5 h-5 bg-transparent border-outline-variant text-primary focus:ring-0 shrink-0"
              />
              <span className="font-label text-xs uppercase tracking-widest text-on-surface">
                {opt}
              </span>
            </label>
          ))}
      </div>
    </fieldset>
  );
}
