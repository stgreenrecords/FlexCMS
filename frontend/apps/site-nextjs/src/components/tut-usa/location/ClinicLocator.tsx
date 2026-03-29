export interface ClinicLocatorData {
  title: string;
  apiEndpoint: string;
  specialtyFilters: string[];
  openNow: boolean;
}

interface Props {
  data: ClinicLocatorData;
}

export function ClinicLocator({ data }: Props) {
  const { title, specialtyFilters, openNow } = data;

  return (
    <section className="flex flex-col gap-4">
      {title && (
        <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
      )}
      {openNow && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/20 w-fit">
          <span
            className="w-2 h-2 rounded-full bg-tertiary flex-shrink-0"
            aria-hidden="true"
          />
          <span className="text-xs text-on-surface-variant font-label">Open now</span>
        </div>
      )}
      {specialtyFilters && specialtyFilters.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Specialty filters">
          {specialtyFilters.map((specialty, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-full border border-outline-variant/40 bg-surface-container text-xs text-on-surface-variant font-label cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              {specialty}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Enter zip code or city"
          className="flex-1 rounded-lg border border-outline-variant/40 bg-surface-container px-4 py-2 text-sm text-on-surface font-label placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Search clinic location"
          readOnly
        />
        <button
          type="button"
          className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-label font-semibold"
        >
          Find Clinic
        </button>
      </div>
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6 text-center text-sm text-on-surface-variant font-label min-h-[120px] flex items-center justify-center">
        Clinic results will appear here
      </div>
    </section>
  );
}
