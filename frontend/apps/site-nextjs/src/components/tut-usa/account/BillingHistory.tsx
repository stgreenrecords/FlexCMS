export interface Invoice {
  invoiceNumber: string;
  date: string;
  amount: number;
  status: string;
  downloadUrl?: string;
}

export interface BillingHistoryData {
  title: string;
  invoices: Invoice[];
  downloadPdf: boolean;
}

export function BillingHistory({ data }: { data: BillingHistoryData }) {
  return (
    <section className="bg-surface-container p-10">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      {data.invoices && data.invoices.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/20">
              <th className="font-label uppercase text-xs tracking-widest text-secondary text-left pb-3">Invoice</th>
              <th className="font-label uppercase text-xs tracking-widest text-secondary text-left pb-3">Date</th>
              <th className="font-label uppercase text-xs tracking-widest text-secondary text-right pb-3">Amount</th>
              <th className="font-label uppercase text-xs tracking-widest text-secondary text-left pb-3 pl-4">Status</th>
              {data.downloadPdf && <th className="pb-3" />}
            </tr>
          </thead>
          <tbody>
            {data.invoices.map((inv, i) => (
              <tr key={i} className="border-b border-outline-variant/10">
                <td className="py-4 font-body text-sm text-on-surface">{inv.invoiceNumber}</td>
                <td className="py-4 font-body text-sm text-secondary">{inv.date}</td>
                <td className="py-4 font-body text-sm text-on-surface text-right">${inv.amount.toLocaleString()}</td>
                <td className="py-4 pl-4">
                  <span className={`font-label uppercase text-xs tracking-widest ${inv.status === 'paid' ? 'text-primary' : 'text-secondary'}`}>
                    {inv.status}
                  </span>
                </td>
                {data.downloadPdf && (
                  <td className="py-4 text-right">
                    {inv.downloadUrl && (
                      <a href={inv.downloadUrl} className="font-label text-xs text-primary hover:underline uppercase tracking-widest">PDF</a>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="font-body text-sm text-secondary text-center py-12">No billing history.</p>
      )}
    </section>
  );
}
