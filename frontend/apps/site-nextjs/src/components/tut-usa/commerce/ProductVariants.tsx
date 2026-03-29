export interface VariantOption {
  name: string;
  values: string[];
}

export interface ProductVariantsData {
  variantOptions: VariantOption[];
  defaultVariant: string;
  stockAware: boolean;
}

export function ProductVariants({ data }: { data: ProductVariantsData }) {
  return (
    <div className="bg-surface-container-low p-6 space-y-6">
      {data.variantOptions && data.variantOptions.map((option, i) => (
        <div key={i}>
          <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-3">
            {option.name}
          </label>
          <div className="flex flex-wrap gap-2">
            {option.values?.map((val, j) => (
              <button
                key={j}
                type="button"
                className={`px-4 py-2 font-label text-xs uppercase tracking-widest border transition-all ${
                  val === data.defaultVariant
                    ? 'bg-primary text-on-primary border-primary'
                    : 'border-outline-variant/40 text-secondary hover:border-primary hover:text-on-surface'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      ))}
      {data.stockAware && (
        <p className="font-label text-xs uppercase tracking-widest text-secondary">
          In stock availability shown at checkout
        </p>
      )}
    </div>
  );
}
