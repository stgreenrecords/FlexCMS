/** tut/stat-counter — displays a single stat value with unit and label. */
export function StatCounter({ data }: { data: Record<string, unknown> }) {
  const value = data.value as string | undefined;
  const unit = data.unit as string | undefined;
  const label = data.label as string | undefined;

  return (
    <div className="flex flex-col items-center text-center py-10 px-6">
      <div className="text-6xl font-extrabold tracking-tight text-white leading-none">
        {value}
        {unit && <span className="text-3xl font-light ml-1">{unit}</span>}
      </div>
      {label && (
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
      )}
    </div>
  );
}
