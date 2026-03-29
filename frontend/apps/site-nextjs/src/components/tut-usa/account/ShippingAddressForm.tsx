import type { AccountField } from './RegistrationForm';

export interface ShippingAddressFormData {
  title: string;
  fields: AccountField[];
  addressValidation: boolean;
}

export function ShippingAddressForm({ data }: { data: ShippingAddressFormData }) {
  return (
    <div className="bg-surface-container p-8">
      <h3 className="font-headline italic text-2xl text-on-surface mb-6">{data.title}</h3>
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
        {data.addressValidation && (
          <p className="font-body text-xs text-secondary">Address will be validated at checkout.</p>
        )}
      </form>
    </div>
  );
}
