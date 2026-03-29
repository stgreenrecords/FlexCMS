export interface Certification {
  name: string;
  issuer: string;
  expiryDate?: string;
  logo?: string;
}

export interface CertificationListData {
  title: string;
  certifications: Certification[];
  showExpiration: boolean;
}

interface Props {
  data: CertificationListData;
}

export function CertificationList({ data }: Props) {
  const { title, certifications, showExpiration } = data;

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      {title && (
        <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
      )}
      {certifications && certifications.length > 0 ? (
        <ul className="flex flex-col divide-y divide-outline-variant/40 list-none p-0">
          {certifications.map((cert, i) => (
            <li key={i} className="flex items-center gap-4 py-3">
              {cert.logo && (
                <img
                  src={cert.logo}
                  alt={cert.name}
                  width={48}
                  height={48}
                  className="w-10 h-10 object-contain flex-shrink-0"
                />
              )}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="font-body text-on-surface text-sm font-medium truncate">{cert.name}</span>
                <span className="font-label uppercase text-xs tracking-widest text-secondary">{cert.issuer}</span>
              </div>
              {showExpiration && cert.expiryDate && (
                <span className="font-label uppercase text-xs tracking-widest text-on-surface-variant flex-shrink-0">
                  Exp: {cert.expiryDate}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-on-surface-variant">No certifications listed.</p>
      )}
    </section>
  );
}
