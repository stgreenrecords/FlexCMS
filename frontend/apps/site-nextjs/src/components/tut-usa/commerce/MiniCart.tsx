export interface MiniCartData {
  title: string;
  cartSource: string;
  showSubtotal: boolean;
  checkoutUrl: string;
}

export function MiniCart({ data }: { data: MiniCartData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-6 w-80">
      <h3 className="font-label uppercase text-xs tracking-widest text-primary mb-6">{data.title || 'Cart'}</h3>
      <div className="space-y-4 mb-6">
        <p className="font-body text-sm text-secondary text-center py-8">Your cart is empty</p>
      </div>
      {data.showSubtotal && (
        <div className="flex justify-between items-center border-t border-outline-variant/20 pt-4 mb-4">
          <span className="font-label uppercase text-xs tracking-widest text-secondary">Subtotal</span>
          <span className="font-headline text-xl text-on-surface">$0.00</span>
        </div>
      )}
      {data.checkoutUrl && (
        <a
          href={data.checkoutUrl}
          className="block w-full bg-primary text-on-primary py-3 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all text-center"
        >
          Checkout
        </a>
      )}
    </div>
  );
}
