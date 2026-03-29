export interface ServiceCenterCardData {
  name: string;
  address: string;
  phone: string;
  services: string[];
  appointmentUrl: string;
}

interface Props {
  data: ServiceCenterCardData;
}

export function ServiceCenterCard({ data }: Props) {
  const { name, address, phone, services, appointmentUrl } = data;

  return (
    <article className="bg-surface-container rounded-xl border border-outline-variant/20 p-5 flex flex-col gap-3">
      {name && (
        <h3 className="font-headline italic text-on-surface text-lg leading-snug">{name}</h3>
      )}
      {address && (
        <p className="text-sm text-on-surface-variant font-label leading-relaxed">{address}</p>
      )}
      {phone && (
        <a
          href={`tel:${phone}`}
          className="text-sm text-primary font-label hover:underline"
        >
          {phone}
        </a>
      )}
      {services && services.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Services offered">
          {services.map((service, index) => (
            <li
              key={index}
              className="px-3 py-1 rounded-full border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface-variant font-label"
            >
              {service}
            </li>
          ))}
        </ul>
      )}
      {appointmentUrl && (
        <a
          href={appointmentUrl}
          className="mt-2 inline-flex items-center justify-center px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-label font-semibold hover:opacity-90 transition-opacity w-fit"
        >
          Book appointment
        </a>
      )}
    </article>
  );
}
