export interface SuccessMilestone {
  name: string;
  target: string;
  status: string;
}

export interface SuccessPlanData {
  title: string;
  goals: string[];
  milestones: SuccessMilestone[];
  owner: string;
}

export function SuccessPlan({ data }: { data: SuccessPlanData }) {
  return (
    <section className="px-12 py-20">
      <div className="flex justify-between items-start mb-12">
        <h2 className="font-headline italic text-4xl text-on-surface">{data.title}</h2>
        {data.owner && (
          <span className="font-label text-xs text-secondary uppercase tracking-widest">
            Owner: {data.owner}
          </span>
        )}
      </div>
      {data.goals && data.goals.length > 0 && (
        <div className="mb-12">
          <h3 className="font-label text-xs font-bold text-primary uppercase tracking-[0.3em] mb-6">Goals</h3>
          <ul className="space-y-3">
            {data.goals.map((goal, i) => (
              <li key={i} className="flex items-start gap-3 font-body text-sm text-secondary">
                <span className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                {goal}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.milestones && data.milestones.length > 0 && (
        <div>
          <h3 className="font-label text-xs font-bold text-primary uppercase tracking-[0.3em] mb-6">Milestones</h3>
          <div className="space-y-4">
            {data.milestones.map((m, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-surface-container-low border border-outline-variant/20">
                <span className="font-body text-sm text-on-surface">{m.name}</span>
                <span className="font-label text-xs text-secondary">{m.target}</span>
                {m.status && (
                  <span className="font-label text-xs text-primary uppercase tracking-widest">{m.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
