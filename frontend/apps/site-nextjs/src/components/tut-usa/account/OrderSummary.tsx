export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderTotal {
  label: string;
  amount: number;
}

export interface OrderSummaryData {
  orderNumber: string;
  items: OrderItem[];
  totals: OrderTotal[];
  deliveryEstimate: string;
}

export function OrderSummary({ data }: { data: OrderSummaryData }) {
  return (
    <section className="bg-surface-container p-10 max-w-2xl">
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="font-headline italic text-3xl text-on-surface">Order Confirmed</h2>
        {data.orderNumber && (
          <span className="font-label uppercase text-xs tracking-widest text-secondary">#{data.orderNumber}</span>
        )}
      </div>
      {data.deliveryEstimate && (
        <p className="font-body text-sm text-secondary mb-8">
          Estimated delivery: <span className="text-on-surface">{data.deliveryEstimate}</span>
        </p>
      )}
      {data.items && data.items.length > 0 && (
        <div className="space-y-4 mb-8">
          {data.items.map((item, i) => (
            <div key={i} className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-4">
                {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover" />}
                <div>
                  <span className="font-body text-sm text-on-surface block">{item.name}</span>
                  <span className="font-label text-xs text-secondary">Qty: {item.quantity}</span>
                </div>
              </div>
              <span className="font-body text-sm text-on-surface">${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      {data.totals && data.totals.length > 0 && (
        <div className="space-y-2">
          {data.totals.map((t, i) => (
            <div key={i} className={`flex justify-between ${i === data.totals.length - 1 ? 'border-t border-outline-variant/20 pt-2' : ''}`}>
              <span className="font-label uppercase text-xs tracking-widest text-secondary">{t.label}</span>
              <span className={`font-body text-sm ${i === data.totals.length - 1 ? 'font-headline text-xl text-primary' : 'text-on-surface'}`}>
                ${t.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
