export interface ReservationFormField {
  name: string;
  label: string;
  type: string;
}

export interface ReservationFormData {
  title: string;
  fields: ReservationFormField[];
  availabilitySource: string;
  confirmationMessage: string;
}

export function ReservationForm({ data }: { data: ReservationFormData }) {
  return (
    <div className="bg-surface-container p-8">
      <h3 className="font-headline italic text-2xl text-on-surface mb-6">{data.title}</h3>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {data.fields && data.fields.map((f, i) => (
          <div key={i}>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">{f.label}</label>
            <input
              type={f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'}
              name={f.name}
              className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface font-body text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>
        ))}
        <button type="submit" className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all">
          Reserve
        </button>
      </form>
      {data.confirmationMessage && (
        <p className="font-body text-xs text-secondary mt-4 text-center">{data.confirmationMessage}</p>
      )}
    </div>
  );
}
