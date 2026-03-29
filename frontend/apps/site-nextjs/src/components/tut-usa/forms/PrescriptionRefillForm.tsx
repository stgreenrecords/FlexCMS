import type { FormFieldDef } from './LeadForm';

export interface PrescriptionRefillFormData {
  title: string;
  fields: FormFieldDef[];
  pharmacyLocations: string[];
  submitAction: string;
}

export function PrescriptionRefillForm({ data }: { data: PrescriptionRefillFormData }) {
  return (
    <div className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {data.pharmacyLocations && data.pharmacyLocations.length > 0 && (
          <div>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
              Pharmacy Location <span className="text-error">*</span>
            </label>
            <select className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface focus:outline-none focus:border-primary transition-all appearance-none">
              <option value="">Select location</option>
              {data.pharmacyLocations.map((loc, i) => (
                <option key={i} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        )}
        {data.fields &&
          data.fields.map((f, i) => (
            <div key={i}>
              <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
                {f.label}
              </label>
              <input
                type="text"
                name={f.name}
                placeholder={f.placeholder}
                className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
              />
            </div>
          ))}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Request Refill
        </button>
      </form>
    </div>
  );
}
