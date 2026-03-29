export interface MediaContactData {
  name: string;
  title: string;
  email: string;
  phone: string;
}

interface Props {
  data: MediaContactData;
}

export function MediaContact({ data }: Props) {
  const { name, title, email, phone } = data;

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-3">
      <span className="font-label uppercase text-xs tracking-widest text-secondary">For Media Inquiries</span>
      <h3 className="font-headline italic text-on-surface text-xl leading-snug">{name}</h3>
      {title && (
        <p className="font-body text-sm text-on-surface-variant">{title}</p>
      )}
      <div className="flex flex-col gap-1 pt-1 border-t border-outline-variant/40">
        {email && (
          <a
            href={`mailto:${email}`}
            className="text-sm text-primary hover:underline"
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
  );
}
