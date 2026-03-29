export interface FormFieldConsentData {
  label: string;
  name: string;
  required: boolean;
  policyLink: string;
  consentVersion: string;
}

export function FormFieldConsent({ data }: { data: FormFieldConsentData }) {
  return (
    <div className="flex gap-4 items-start bg-surface-container-low border-l-4 border-primary p-6">
      <div className="shrink-0 pt-0.5">
        <input
          type="checkbox"
          name={data.name}
          className="w-5 h-5 bg-transparent border-outline-variant text-primary focus:ring-0"
        />
      </div>
      <div>
        <p className="font-body text-sm text-secondary leading-relaxed">
          {data.label}{' '}
          {data.policyLink && (
            <a href={data.policyLink} className="text-primary underline">
              Privacy Policy
            </a>
          )}
        </p>
        {data.consentVersion && (
          <span className="font-label text-xs text-secondary uppercase tracking-widest mt-2 block">
            Version: {data.consentVersion}
          </span>
        )}
        {data.required && (
          <span className="font-label text-xs text-error uppercase tracking-widest mt-1 block">
            Required
          </span>
        )}
      </div>
    </div>
  );
}
