export interface FormFieldCheckboxData {
  label: string;
  name: string;
  required: boolean;
  defaultChecked: boolean;
}

export function FormFieldCheckbox({ data }: { data: FormFieldCheckboxData }) {
  return (
    <label className="flex items-start gap-4 cursor-pointer">
      <input
        type="checkbox"
        name={data.name}
        defaultChecked={data.defaultChecked}
        className="w-5 h-5 mt-0.5 bg-transparent border-outline-variant text-primary focus:ring-0 shrink-0"
      />
      <span className="font-body text-sm text-secondary">
        {data.label}
        {data.required && <span className="text-error ml-1">*</span>}
      </span>
    </label>
  );
}
