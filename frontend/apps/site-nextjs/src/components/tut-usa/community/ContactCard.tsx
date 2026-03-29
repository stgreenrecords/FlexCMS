export interface ContactCardData {
  name: string;
  role: string;
  email: string;
  phone: string;
  /** Photo — 80×80 */
  photo: string;
}

interface Props {
  data: ContactCardData;
}

export function ContactCard({ data }: Props) {
  const { name, role, email, phone, photo } = data;

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/40 p-4 flex items-center gap-4">
      {photo && (
        <img
          src={photo}
          alt={name}
          width={80}
          height={80}
          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
        />
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-headline italic text-on-surface text-base leading-tight">{name}</span>
        {role && (
          <span className="font-label uppercase text-xs tracking-widest text-secondary">{role}</span>
        )}
        <div className="flex flex-col gap-0.5 mt-1">
          {email && (
            <a
              href={`mailto:${email}`}
              className="text-sm text-primary hover:underline truncate"
            >
              {email}
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="text-sm text-primary hover:underline"
            >
              {phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
