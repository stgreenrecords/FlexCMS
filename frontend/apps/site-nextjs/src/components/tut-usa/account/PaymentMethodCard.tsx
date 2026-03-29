export interface PaymentMethodCardData {
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export function PaymentMethodCard({ data }: { data: PaymentMethodCardData }) {
  return (
    <div className={`bg-surface-container border p-6 ${data.isDefault ? 'border-primary' : 'border-outline-variant/30'}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="font-label uppercase text-xs tracking-widest text-on-surface">{data.brand}</span>
        {data.isDefault && (
          <span className="font-label uppercase text-xs tracking-widest text-primary bg-primary/10 px-2 py-1">Default</span>
        )}
      </div>
      <span className="font-headline text-xl text-on-surface tracking-widest block mb-1">
        •••• •••• •••• {data.last4}
      </span>
      <span className="font-label text-xs text-secondary">
        Expires {String(data.expiryMonth).padStart(2, '0')}/{data.expiryYear}
      </span>
    </div>
  );
}
