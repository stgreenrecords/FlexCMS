interface CountryItem { code: string; name: string }
interface Props { data: Record<string, unknown> }

export function CountrySelector({ data }: Props) {
  const countries = (data.countries as CountryItem[]) ?? [];
  const defaultCountry = (data.defaultCountry as string) ?? '';

  return (
    <div className="inline-flex flex-col gap-1">
      <label className="text-xs text-neutral-500 uppercase tracking-widest" htmlFor="country-selector">
        Country / Region
      </label>
      <select
        id="country-selector"
        defaultValue={defaultCountry}
        className="bg-neutral-900 border border-neutral-700 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-white uppercase tracking-wide appearance-none cursor-pointer min-w-[160px]"
      >
        {defaultCountry && countries.every((c) => c.code !== defaultCountry && c.name !== defaultCountry) && (
          <option value={defaultCountry}>{defaultCountry}</option>
        )}
        {countries.map((country, i) => (
          <option key={i} value={country.code ?? country.name}>
            {country.name ?? country.code}
          </option>
        ))}
        {countries.length === 0 && !defaultCountry && (
          <option value="">Select a country</option>
        )}
      </select>
    </div>
  );
}
