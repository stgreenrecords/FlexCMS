export interface SubscriptionStatusData {
  planName: string;
  status: string;
  renewalDate: string;
  manageUrl: string;
}

export function SubscriptionStatus({ data }: { data: SubscriptionStatusData }) {
  const statusColor = data.status === 'active' ? 'text-primary' : data.status === 'cancelled' ? 'text-error' : 'text-secondary';
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">Current Plan</span>
          <h3 className="font-headline italic text-2xl text-on-surface">{data.planName}</h3>
        </div>
        <span className={`font-label uppercase text-xs tracking-widest ${statusColor}`}>{data.status}</span>
      </div>
      {data.renewalDate && (
        <p className="font-body text-sm text-secondary mb-6">
          Renews: <span className="text-on-surface">{data.renewalDate}</span>
        </p>
      )}
      {data.manageUrl && (
        <a
          href={data.manageUrl}
          className="font-label uppercase text-xs tracking-widest text-primary hover:underline"
        >
          Manage Subscription →
        </a>
      )}
    </div>
  );
}
