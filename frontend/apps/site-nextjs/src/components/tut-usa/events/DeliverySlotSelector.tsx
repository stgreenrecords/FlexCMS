export interface DeliverySlot {
  date: string;
  timeRange: string;
  available: boolean;
}

export interface DeliverySlotSelectorData {
  title: string;
  slots: DeliverySlot[];
  defaultSlot: string;
  submitAction: string;
}

export function DeliverySlotSelector({ data }: { data: DeliverySlotSelectorData }) {
  return (
    <div className="bg-surface-container-low p-8">
      <h3 className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-6">{data.title}</h3>
      {data.slots && data.slots.length > 0 && (
        <div className="space-y-3">
          {data.slots.map((slot, i) => {
            const isDefault = `${slot.date} ${slot.timeRange}` === data.defaultSlot;
            return (
              <label key={i} className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${!slot.available ? 'opacity-40 cursor-not-allowed' : isDefault ? 'border-primary' : 'border-outline-variant/30 hover:border-primary/50'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="slot" disabled={!slot.available} defaultChecked={isDefault} className="accent-primary" />
                  <span className="font-label uppercase text-xs tracking-widest text-on-surface">{slot.date}</span>
                </div>
                <span className="font-label text-xs text-secondary uppercase tracking-widest">
                  {slot.available ? slot.timeRange : 'Unavailable'}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
