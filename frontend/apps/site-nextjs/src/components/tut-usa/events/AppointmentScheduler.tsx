export interface AppointmentSchedulerData {
  title: string;
  calendarSource: string;
  durationOptions: number[];
  timeZone: string;
}

export function AppointmentScheduler({ data }: { data: AppointmentSchedulerData }) {
  return (
    <div className="bg-surface-container p-8">
      <h3 className="font-headline italic text-2xl text-on-surface mb-6">{data.title}</h3>
      {data.durationOptions && data.durationOptions.length > 0 && (
        <div className="mb-6">
          <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-3">Duration</label>
          <div className="flex gap-2">
            {data.durationOptions.map((d, i) => (
              <button key={i} type="button" className={`px-4 py-2 font-label text-xs uppercase tracking-widest border transition-all ${i === 0 ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/40 text-secondary hover:border-primary'}`}>
                {d} min
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="bg-surface-container-low aspect-video flex items-center justify-center mb-4">
        <span className="font-label text-xs uppercase tracking-widest text-secondary">Calendar</span>
      </div>
      {data.timeZone && (
        <p className="font-label text-xs uppercase tracking-widest text-secondary text-right">{data.timeZone}</p>
      )}
    </div>
  );
}
