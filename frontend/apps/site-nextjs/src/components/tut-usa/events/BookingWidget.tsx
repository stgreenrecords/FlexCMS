export interface BookingWidgetData {
  title: string;
  availabilitySource: string;
  serviceTypes: string[];
  confirmationMessage: string;
}

export function BookingWidget({ data }: { data: BookingWidgetData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-8">
      <h3 className="font-headline italic text-2xl text-on-surface mb-6">{data.title}</h3>
      {data.serviceTypes && data.serviceTypes.length > 0 && (
        <div className="mb-6">
          <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-3">Service Type</label>
          <div className="flex flex-wrap gap-2">
            {data.serviceTypes.map((s, i) => (
              <button key={i} type="button" className={`px-4 py-2 font-label text-xs uppercase tracking-widest border transition-all ${i === 0 ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/40 text-secondary hover:border-primary'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="bg-surface-container-low aspect-video flex items-center justify-center mb-6">
        <span className="font-label text-xs uppercase tracking-widest text-secondary">Availability Calendar</span>
      </div>
      <button type="button" className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all">
        Book Now
      </button>
      {data.confirmationMessage && (
        <p className="font-body text-xs text-secondary mt-4 text-center">{data.confirmationMessage}</p>
      )}
    </div>
  );
}
