export interface ChartEmbedData {
  title: string;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  dataSource: string;
  caption: string;
}

export function ChartEmbed({ data }: { data: ChartEmbedData }) {
  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-4">{data.title}</h2>
      )}
      <div className="bg-surface-container-low rounded-lg overflow-hidden">
        <div className="aspect-video bg-surface-container-highest flex flex-col items-center justify-center gap-2">
          <span className="text-on-surface-variant text-sm font-medium uppercase tracking-wide">
            Chart: {data.chartType}
          </span>
          {data.dataSource && (
            <span className="text-on-surface-variant/60 text-xs">{data.dataSource}</span>
          )}
        </div>
        {data.caption && (
          <p className="p-4 text-sm text-on-surface-variant">{data.caption}</p>
        )}
      </div>
    </section>
  );
}
