export interface MapEmbedData {
  title: string;
  mapUrl: string;
  address: string;
  zoomLevel: number;
}

interface Props {
  data: MapEmbedData;
}

export function MapEmbed({ data }: Props) {
  const { title, mapUrl, address, zoomLevel } = data;

  return (
    <section className="flex flex-col gap-3">
      {title && (
        <h2 className="font-headline italic text-on-surface text-xl">{title}</h2>
      )}
      {address && (
        <p className="text-sm text-on-surface-variant font-label">{address}</p>
      )}
      <div
        className="w-full rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container"
        style={{ aspectRatio: '16/9' }}
      >
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open map — zoom level ${zoomLevel}`}
          className="flex items-center justify-center w-full h-full min-h-[240px] text-primary underline font-label text-sm"
        >
          View map
        </a>
      </div>
    </section>
  );
}
