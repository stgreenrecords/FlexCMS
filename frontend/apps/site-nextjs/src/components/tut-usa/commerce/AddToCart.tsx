export interface AddToCartData {
  buttonLabel: string;
  productReference: string;
  quantityDefault: number;
  showMiniCart: boolean;
}

export function AddToCart({ data }: { data: AddToCartData }) {
  return (
    <div className="bg-surface-container-low p-6 flex items-center gap-4">
      <div className="flex items-center border border-outline-variant/40">
        <button type="button" className="px-4 py-3 text-secondary hover:text-on-surface transition-all font-body text-lg">−</button>
        <span className="px-4 py-3 font-label text-sm text-on-surface border-x border-outline-variant/40">
          {data.quantityDefault || 1}
        </span>
        <button type="button" className="px-4 py-3 text-secondary hover:text-on-surface transition-all font-body text-lg">+</button>
      </div>
      <button
        type="button"
        className="flex-1 bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
      >
        {data.buttonLabel || 'Add to Cart'}
      </button>
      {data.showMiniCart && (
        <span className="font-label text-xs text-secondary uppercase tracking-widest">Cart (0)</span>
      )}
    </div>
  );
}
