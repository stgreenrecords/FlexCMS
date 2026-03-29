export interface SeatLegendItem {
  label: string;
  color: string;
}

export interface SeatMapData {
  title: string;
  mapDataSource: string;
  selectedSeat: string;
  legend: SeatLegendItem[];
}

export function SeatMap({ data }: { data: SeatMapData }) {
  return (
    <div className="bg-surface-container p-8">
      <h3 className="font-headline italic text-2xl text-on-surface mb-6">{data.title}</h3>
      <div className="bg-surface-container-low aspect-video flex items-center justify-center mb-6 border border-outline-variant/20">
        {data.selectedSeat ? (
          <span className="font-label uppercase text-xs tracking-widest text-primary">Selected: {data.selectedSeat}</span>
        ) : (
          <span className="font-label text-xs uppercase tracking-widest text-secondary">Seat Map</span>
        )}
      </div>
      {data.legend && data.legend.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {data.legend.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3" style={{ backgroundColor: item.color }} />
              <span className="font-label text-xs text-secondary uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
