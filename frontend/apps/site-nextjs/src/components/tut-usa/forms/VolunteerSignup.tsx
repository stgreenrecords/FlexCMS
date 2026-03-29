export interface VolunteerSignupData {
  title: string;
  description: string;
  formReference: string;
  locations: string[];
}

export function VolunteerSignup({ data }: { data: VolunteerSignupData }) {
  return (
    <section className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-4">{data.title}</h2>
      {data.description && (
        <p className="font-body text-secondary mb-8">{data.description}</p>
      )}
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
            Full Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
            Email <span className="text-error">*</span>
          </label>
          <input
            type="email"
            className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>
        {data.locations && data.locations.length > 0 && (
          <div>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">
              Preferred Location
            </label>
            <select className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface focus:outline-none focus:border-primary transition-all appearance-none">
              <option value="">Any location</option>
              {data.locations.map((loc, i) => (
                <option key={i} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Sign Up
        </button>
      </form>
    </section>
  );
}
