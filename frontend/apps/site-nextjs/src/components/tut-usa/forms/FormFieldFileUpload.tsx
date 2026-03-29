export interface FormFieldFileUploadData {
  label: string;
  name: string;
  required: boolean;
  allowedTypes: string[];
  maxFileSizeMb: number;
}

export function FormFieldFileUpload({ data }: { data: FormFieldFileUploadData }) {
  const accept = data.allowedTypes ? data.allowedTypes.join(',') : undefined;
  return (
    <div>
      <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-4">
        {data.label}
        {data.required && <span className="text-error ml-1">*</span>}
      </label>
      <label className="border border-dashed border-outline-variant/40 p-12 text-center group hover:border-primary transition-all block cursor-pointer">
        <span className="text-4xl mb-4 text-secondary group-hover:text-primary transition-colors block">↑</span>
        <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface">
          Drag file or{' '}
          <span className="text-primary underline">Browse</span>
        </p>
        {(data.allowedTypes || data.maxFileSizeMb) && (
          <p className="text-xs text-secondary mt-2 uppercase">
            {data.allowedTypes?.join(', ')}
            {data.maxFileSizeMb ? ` · Max ${data.maxFileSizeMb}MB` : ''}
          </p>
        )}
        <input type="file" name={data.name} accept={accept} className="hidden" />
      </label>
    </div>
  );
}
