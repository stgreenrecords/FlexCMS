export interface AddressBlockData {
  recipient: string;
  street1: string;
  street2: string;
  city: string;
  postalCode: string;
  country: string;
}

export function AddressBlock({ data }: { data: AddressBlockData }) {
  return (
    <address className="bg-surface-container-low border border-outline-variant/30 p-6 not-italic">
      {data.recipient && (
        <span className="font-label text-xs uppercase tracking-widest text-on-surface block mb-1">{data.recipient}</span>
      )}
      <div className="font-body text-sm text-secondary space-y-0.5">
        {data.street1 && <p>{data.street1}</p>}
        {data.street2 && <p>{data.street2}</p>}
        {(data.city || data.postalCode) && (
          <p>{[data.city, data.postalCode].filter(Boolean).join(', ')}</p>
        )}
        {data.country && <p>{data.country}</p>}
      </div>
    </address>
  );
}
