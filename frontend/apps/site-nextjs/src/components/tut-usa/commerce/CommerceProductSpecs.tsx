export interface CommerceSpecGroup {
  groupName: string;
  specs: { name: string; value: string }[];
}

export interface CommerceProductSpecsData {
  title: string;
  specGroups: CommerceSpecGroup[];
  /** Download sheet asset URL */
  downloadSheet: string;
}

export function CommerceProductSpecs({ data }: { data: CommerceProductSpecsData }) {
  return (
    <section className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      {data.specGroups && data.specGroups.map((group, i) => (
        <div key={i} className="mb-8">
          <h3 className="font-label uppercase text-xs tracking-widest text-primary mb-3">{group.groupName}</h3>
          <table className="w-full">
            <tbody>
              {group.specs?.map((spec, j) => (
                <tr key={j} className="border-b border-outline-variant/20">
                  <td className="py-3 font-label uppercase text-xs tracking-widest text-secondary w-1/2">{spec.name}</td>
                  <td className="py-3 font-body text-sm text-on-surface">{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {data.downloadSheet && (
        <a
          href={data.downloadSheet}
          className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-3 font-label uppercase text-xs tracking-widest hover:bg-primary hover:text-on-primary transition-all"
        >
          Download Spec Sheet
        </a>
      )}
    </section>
  );
}
