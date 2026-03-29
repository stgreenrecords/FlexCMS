export interface ImplementationPhase {
  name: string;
  description: string;
  duration: string;
}

export interface ImplementationPlanData {
  title: string;
  phases: ImplementationPhase[];
  owners: string[];
  estimatedDuration: string;
}

export function ImplementationPlan({ data }: { data: ImplementationPlanData }) {
  return (
    <section className="px-12 py-20">
      <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6">
        <h2 className="font-headline italic text-4xl text-on-surface">{data.title}</h2>
        <div className="text-right">
          {data.estimatedDuration && (
            <p className="font-label text-xs text-secondary uppercase tracking-widest">
              Est. duration: <span className="text-primary">{data.estimatedDuration}</span>
            </p>
          )}
          {data.owners && data.owners.length > 0 && (
            <p className="font-label text-xs text-secondary uppercase tracking-widest mt-1">
              Owners: {data.owners.join(', ')}
            </p>
          )}
        </div>
      </div>
      {data.phases && data.phases.length > 0 && (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-outline-variant/30" />
          <div className="space-y-8 pl-12">
            {data.phases.map((phase, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-8 top-1 w-3 h-3 rounded-full bg-primary border-2 border-surface" />
                <h3 className="font-headline italic text-xl text-on-surface mb-2">{phase.name}</h3>
                {phase.description && (
                  <p className="font-body text-sm text-secondary mb-1">{phase.description}</p>
                )}
                {phase.duration && (
                  <span className="font-label text-xs text-primary uppercase tracking-widest">
                    {phase.duration}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
