export interface ReservationCardData {
  referenceNumber: string;
  serviceName: string;
  dateTime: string;
  location: string;
  manageUrl: string;
}

export function ReservationCard({ data }: { data: ReservationCardData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-8">
      <div className="flex items-start justify-between mb-6">
        <span className="font-label uppercase text-xs tracking-widest text-secondary">Ref: {data.referenceNumber}</span>
        <span className="font-label uppercase text-xs tracking-widest text-primary">Confirmed</span>
      </div>
      <h3 className="font-headline italic text-2xl text-on-surface mb-4">{data.serviceName}</h3>
      <div className="space-y-2 mb-6">
        {data.dateTime && (
          <p className="font-body text-sm text-secondary">
            <span className="font-label uppercase text-xs tracking-widest text-secondary mr-3">When</span>
            {data.dateTime}
          </p>
        )}
        {data.location && (
          <p className="font-body text-sm text-secondary">
            <span className="font-label uppercase text-xs tracking-widest text-secondary mr-3">Where</span>
            {data.location}
          </p>
        )}
      </div>
      {data.manageUrl && (
        <a href={data.manageUrl} className="font-label uppercase text-xs tracking-widest text-primary hover:underline">
          Manage Reservation →
        </a>
      )}
    </div>
  );
}
