export interface CartItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CartSummaryData {
  items: CartItem[];
  subtotal: number;
  discount: number;
  taxEstimate: number;
  checkoutUrl: string;
}

export function CartSummary({ data }: { data: CartSummaryData }) {
  const total = (data.subtotal ?? 0) - (data.discount ?? 0) + (data.taxEstimate ?? 0);
  return (
    <section className="bg-surface-container p-10 max-w-2xl">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">Order Summary</h2>
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
      <div className="space-y-2 mb-6">
        <div className="flex justify-between">
          <span className="font-label uppercase text-xs tracking-widest text-secondary">Subtotal</span>
          <span className="font-body text-sm text-on-surface">${(data.subtotal ?? 0).toLocaleString()}</span>
        </div>
        {(data.discount ?? 0) > 0 && (
          <div className="flex justify-between">
            <span className="font-label uppercase text-xs tracking-widest text-secondary">Discount</span>
            <span className="font-body text-sm text-primary">−${data.discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-label uppercase text-xs tracking-widest text-secondary">Est. Tax</span>
          <span className="font-body text-sm text-on-surface">${(data.taxEstimate ?? 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-t border-outline-variant/20 pt-2">
          <span className="font-label uppercase text-xs tracking-widest text-on-surface font-bold">Total</span>
          <span className="font-headline text-2xl text-primary">${total.toLocaleString()}</span>
        </div>
      </div>
      {data.checkoutUrl && (
        <a
          href={data.checkoutUrl}
          className="block w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all text-center"
        >
          Proceed to Checkout
        </a>
      )}
    </section>
  );
}
