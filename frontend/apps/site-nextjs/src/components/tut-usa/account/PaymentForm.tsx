import type { AccountField } from './RegistrationForm';

export interface PaymentFormData {
  title: string;
  provider: string;
  fields: AccountField[];
  tokenizationEnabled: boolean;
}

export function PaymentForm({ data }: { data: PaymentFormData }) {
  return (
    <div className="bg-surface-container p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline italic text-2xl text-on-surface">{data.title}</h3>
        {data.provider && (
          <span className="font-label uppercase text-xs tracking-widest text-secondary">{data.provider}</span>
        )}
      </div>
      {data.tokenizationEnabled && (
        <p className="font-body text-xs text-secondary mb-6 flex items-center gap-2">
          <span>🔒</span> Payment details are encrypted and tokenized.
        </p>
      )}
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {data.fields && data.fields.map((f, i) => (
          <div key={i}>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">{f.label}</label>
            <input
              type="text"
              name={f.name}
              className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface font-body text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Save Payment Method
        </button>
      </form>
    </div>
  );
}
