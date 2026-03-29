export interface WishlistButtonData {
  label: string;
  itemReference: string;
  requiresLogin: boolean;
}

export function WishlistButton({ data }: { data: WishlistButtonData }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 border border-outline-variant/40 text-secondary px-6 py-3 font-label uppercase text-xs tracking-widest hover:border-primary hover:text-primary transition-all"
    >
      <span>♡</span>
      {data.label || 'Save to Wishlist'}
    </button>
  );
}
