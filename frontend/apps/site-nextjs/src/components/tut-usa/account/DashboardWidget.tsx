export interface DashboardWidgetData {
  title: string;
  dataSource: string;
  refreshInterval: number;
  emptyState: string;
}

export function DashboardWidget({ data }: { data: DashboardWidgetData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-label uppercase text-xs tracking-widest text-primary">{data.title}</h4>
        {data.refreshInterval > 0 && (
          <span className="font-label text-xs text-secondary">Refresh: {data.refreshInterval}s</span>
        )}
      </div>
      <div className="py-8 text-center">
        <p className="font-body text-sm text-secondary">{data.emptyState || 'No data available.'}</p>
      </div>
    </div>
  );
}
