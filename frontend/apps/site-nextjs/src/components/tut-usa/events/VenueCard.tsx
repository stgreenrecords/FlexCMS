export interface VenueCardData {
  name: string;
  address: string;
  capacity: number;
  mapUrl: string;
  /** Venue image — 800×400 */
  image: string;
}

export function VenueCard({ data }: { data: VenueCardData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30">
      {data.image && (
        <div className="overflow-hidden h-48">
          <img src={data.image} alt={data.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6">
        <h3 className="font-headline italic text-2xl text-on-surface mb-3">{data.name}</h3>
        {data.address && (
          <p className="font-body text-sm text-secondary mb-2">{data.address}</p>
        )}
        {data.capacity > 0 && (
          <p className="font-label uppercase text-xs tracking-widest text-secondary mb-4">
            Capacity: {data.capacity.toLocaleString()}
          </p>
        )}
        {data.mapUrl && (
          <a href={data.mapUrl} target="_blank" rel="noopener noreferrer" className="font-label uppercase text-xs tracking-widest text-primary hover:underline">
            View on Map →
          </a>
        )}
      </div>
    </div>
  );
}
