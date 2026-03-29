export interface RoomOption {
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  image: string;
  available: boolean;
}

export interface RoomSelectorData {
  title: string;
  rooms: RoomOption[];
  occupancyFilters: { label: string; value: number }[];
  cta: { label: string; url: string };
}

export function RoomSelector({ data }: { data: RoomSelectorData }) {
  return (
    <section className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-6">{data.title}</h2>
      {data.occupancyFilters && data.occupancyFilters.length > 0 && (
        <div className="flex gap-2 mb-8">
          {data.occupancyFilters.map((f, i) => (
            <button key={i} type="button" className="border border-outline-variant/40 px-4 py-2 font-label text-xs uppercase tracking-widest text-secondary hover:border-primary hover:text-on-surface transition-all">
              {f.label}
            </button>
          ))}
        </div>
      )}
      {data.rooms && data.rooms.length > 0 && (
        <div className="space-y-4">
          {data.rooms.map((room, i) => (
            <div key={i} className={`bg-surface-container-low border p-6 flex gap-6 ${room.available ? 'border-outline-variant/30' : 'border-outline-variant/10 opacity-60'}`}>
              {room.image && <img src={room.image} alt={room.name} className="w-32 h-24 object-cover flex-shrink-0" />}
              <div className="flex-1">
                <h3 className="font-headline italic text-xl text-on-surface mb-1">{room.name}</h3>
                {room.description && <p className="font-body text-sm text-secondary mb-2">{room.description}</p>}
                <span className="font-label text-xs text-secondary">Up to {room.capacity} guests</span>
              </div>
              <div className="text-right flex flex-col justify-between">
                <span className="font-headline text-2xl text-primary">${room.pricePerNight}/night</span>
                {room.available && data.cta?.label && (
                  <a href={data.cta.url} className="bg-primary text-on-primary px-6 py-2 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all text-center">
                    {data.cta.label}
                  </a>
                )}
                {!room.available && (
                  <span className="font-label uppercase text-xs tracking-widest text-secondary">Unavailable</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
