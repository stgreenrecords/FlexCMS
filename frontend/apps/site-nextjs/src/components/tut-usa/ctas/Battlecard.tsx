export interface BattlecardData {
  competitorName: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  talkingPoints: string[];
}

export function Battlecard({ data }: { data: BattlecardData }) {
  return (
    <article className="border border-outline-variant/30 bg-surface-container p-8">
      <div className="flex justify-between items-start mb-8">
        <h3 className="font-headline italic text-3xl text-on-surface">vs. {data.competitorName}</h3>
      </div>
      {data.summary && (
        <p className="font-body text-secondary mb-10 leading-relaxed">{data.summary}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {data.strengths && data.strengths.length > 0 && (
          <div>
            <h4 className="font-label text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4">
              Our Strengths
            </h4>
            <ul className="space-y-3">
              {data.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 font-body text-sm text-secondary">
                  <span className="text-primary mt-0.5">+</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.weaknesses && data.weaknesses.length > 0 && (
          <div>
            <h4 className="font-label text-xs font-bold text-error uppercase tracking-[0.3em] mb-4">
              Their Weaknesses
            </h4>
            <ul className="space-y-3">
              {data.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 font-body text-sm text-secondary">
                  <span className="text-error mt-0.5">−</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.talkingPoints && data.talkingPoints.length > 0 && (
          <div>
            <h4 className="font-label text-xs font-bold text-on-surface uppercase tracking-[0.3em] mb-4">
              Talking Points
            </h4>
            <ul className="space-y-3">
              {data.talkingPoints.map((tp, i) => (
                <li key={i} className="flex items-start gap-2 font-body text-sm text-secondary">
                  <span className="text-secondary mt-0.5">›</span> {tp}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
