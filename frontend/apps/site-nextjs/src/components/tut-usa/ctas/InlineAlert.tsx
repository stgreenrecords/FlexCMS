export interface InlineAlertData {
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  /** Alert icon — 24×24 */
  icon: string;
}

const severityStyles: Record<string, string> = {
  info: 'bg-surface-container text-on-surface',
  warning: 'bg-tertiary-container text-on-tertiary-container',
  error: 'bg-error-container text-on-error-container',
  success: 'bg-secondary-container text-on-secondary-container',
};

export function InlineAlert({ data }: { data: InlineAlertData }) {
  const style = severityStyles[data.severity] ?? severityStyles.info;
  return (
    <div role="status" className={`flex items-start gap-3 rounded p-4 ${style}`}>
      {data.icon && (
        <img src={data.icon} alt="" aria-hidden="true" className="w-5 h-5 mt-0.5 shrink-0" />
      )}
      <p className="text-sm font-body">{data.message}</p>
    </div>
  );
}
