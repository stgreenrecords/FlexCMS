export interface ReportIssueLinkData {
  label: string;
  url: string;
  issueTypeOptions: string[];
}

export function ReportIssueLink({ data }: { data: ReportIssueLinkData }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-error text-sm">⚠</span>
      <a
        href={data.url}
        className="font-label text-xs uppercase tracking-widest text-secondary hover:text-error border-b border-transparent hover:border-error transition-all"
      >
        {data.label || 'Report an issue'}
      </a>
    </div>
  );
}
