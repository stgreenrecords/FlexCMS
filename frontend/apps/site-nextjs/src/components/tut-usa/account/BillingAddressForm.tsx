import type { AccountField } from './RegistrationForm';

export interface BillingAddressFormData {
  title: string;
  fields: AccountField[];
  sameAsShipping: boolean;
}

export function BillingAddressForm({ data }: { data: BillingAddressFormData }) {
  return (
    <div className="bg-surface-container p-8">
      <h3 className="font-headline italic text-2xl text-on-surface mb-6">{data.title}</h3>
      {data.sameAsShipping && (
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-primary" />
          <span className="font-label text-xs uppercase tracking-widest text-secondary">Same as shipping address</span>
        </label>
      )}
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {data.fields && data.fields.map((f, i) => (
          <div key={i}>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">{f.label}</label>
            <input
              type={f.type === 'email' ? 'email' : 'text'}
              name={f.name}
              className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface font-body text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>
        ))}
      </form>
    </div>
  );
}
