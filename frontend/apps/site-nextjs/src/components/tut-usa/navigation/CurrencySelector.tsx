interface Props { data: Record<string, unknown> }

export function CurrencySelector({ data }: Props) {
  const currencies = (data.currencies as string[]) ?? [];
  const defaultCurrency = (data.defaultCurrency as string) ?? '';

  const displayCurrencies = currencies.length > 0 ? currencies : (defaultCurrency ? [defaultCurrency] : []);

  return (
    <div className="inline-flex flex-col gap-1">
      <label className="text-xs text-neutral-500 uppercase tracking-widest" htmlFor="currency-selector">
        Currency
      </label>
      <select
        id="currency-selector"
        defaultValue={defaultCurrency}
        className="bg-neutral-900 border border-neutral-700 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-white uppercase tracking-wide appearance-none cursor-pointer min-w-[120px]"
      >
        {displayCurrencies.map((currency, i) => (
          <option key={i} value={currency}>
            {currency}
          </option>
        ))}
        {displayCurrencies.length === 0 && (
          <option value="">Select currency</option>
        )}
      </select>
    </div>
  );
}
