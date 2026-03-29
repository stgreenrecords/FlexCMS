export interface IconLibraryData {
  title: string;
  icons: string[];
  /** Download zip — 48×48 icon */
  downloadZip: string;
}

export function IconLibrary({ data }: { data: IconLibraryData }) {
  return (
    <section className="py-10 bg-surface">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        {data.title && (
          <h2 className="text-2xl font-semibold text-on-surface">{data.title}</h2>
        )}
        {data.downloadZip && (
          <a
            href={data.downloadZip}
            download
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded transition hover:opacity-90"
          >
            <span className="w-5 h-5 bg-on-primary/20 rounded flex items-center justify-center text-xs">
              ↓
            </span>
            Download All Icons
          </a>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
        {data.icons?.map((src, i) => (
          <div
            key={i}
            className="aspect-square bg-surface-container-low rounded-lg p-3 flex items-center justify-center hover:bg-surface-container-highest transition"
            title={`Icon ${i + 1}`}
          >
            <img
              src={src}
              alt={`Icon ${i + 1}`}
              className="w-full h-full object-contain filter brightness-90"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
