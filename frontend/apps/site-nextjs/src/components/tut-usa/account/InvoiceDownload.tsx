export interface InvoiceDownloadData {
  invoiceNumber: string;
  invoiceDate: string;
  /** Invoice PDF or file URL */
  file: string;
  amount: number;
}

export function InvoiceDownload({ data }: { data: InvoiceDownloadData }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/30 p-6 flex items-center justify-between">
      <div>
        <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">Invoice</span>
        <span className="font-headline text-xl text-on-surface block">{data.invoiceNumber}</span>
        <span className="font-label text-xs text-secondary">{data.invoiceDate}</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="font-headline text-2xl text-primary">
          {typeof data.amount === 'number' ? `$${data.amount.toLocaleString()}` : data.amount}
        </span>
        {data.file && (
          <a
            href={data.file}
            download
            className="bg-primary text-on-primary px-6 py-3 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all"
          >
            Download PDF
          </a>
        )}
      </div>
    </div>
  );
}
