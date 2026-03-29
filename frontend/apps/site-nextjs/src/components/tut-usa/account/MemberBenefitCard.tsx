export interface MemberBenefitCardData {
  title: string;
  description: string;
  /** Benefit icon — 48×48 */
  icon: string;
  eligibility: string;
}

export function MemberBenefitCard({ data }: { data: MemberBenefitCardData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-8">
      {data.icon && <img src={data.icon} alt="" className="w-10 h-10 object-contain mb-4" />}
      <h3 className="font-headline italic text-xl text-on-surface mb-3">{data.title}</h3>
      {data.description && <p className="font-body text-sm text-secondary mb-4">{data.description}</p>}
      {data.eligibility && (
        <span className="font-label uppercase text-xs tracking-widest text-primary">{data.eligibility}</span>
      )}
    </div>
  );
}
