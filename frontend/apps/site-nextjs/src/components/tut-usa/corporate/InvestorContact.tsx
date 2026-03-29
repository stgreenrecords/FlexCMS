export interface InvestorContactData {
  name: string;
  title: string;
  email: string;
  phone: string;
}

interface Props {
  data: InvestorContactData;
}

export function InvestorContact({ data }: Props) {
  const { name, title, email, phone } = data;

  return (
    <address className="not-italic bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col gap-1">
      <span className="font-headline text-base text-[var(--color-on-surface)]">{name}</span>
      <span className="font-label text-sm text-[var(--color-on-surface-variant)]">{title}</span>
      <a
        href={`mailto:${email}`}
        className="text-sm text-[var(--color-primary)] hover:underline mt-2"
      >
        {email}
      </a>
      <a
        href={`tel:${phone}`}
        className="text-sm text-[var(--color-on-surface)] hover:underline"
      >
        {phone}
      </a>
    </address>
  );
}
