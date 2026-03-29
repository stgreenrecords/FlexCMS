export interface CouponEntryData {
  label: string;
  placeholder: string;
  validationEndpoint: string;
  errorMessage: string;
}

export function CouponEntry({ data }: { data: CouponEntryData }) {
  return (
    <div className="bg-surface-container-low p-6">
      <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-3">
        {data.label || 'Promo Code'}
      </label>
      <div className="flex gap-0">
        <input
          type="text"
          placeholder={data.placeholder || 'Enter code'}
          className="flex-1 bg-transparent border border-outline-variant/40 py-3 px-4 text-on-surface placeholder:text-secondary font-body text-sm focus:outline-none focus:border-primary transition-all"
        />
        <button
          type="button"
          className="bg-primary text-on-primary px-6 py-3 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all"
        >
          Apply
        </button>
      </div>
      {data.errorMessage && (
        <p className="font-body text-xs text-error mt-2">{data.errorMessage}</p>
      )}
    </div>
  );
}
