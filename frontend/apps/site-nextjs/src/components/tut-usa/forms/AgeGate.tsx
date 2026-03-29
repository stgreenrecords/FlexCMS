export interface AgeGateData {
  title: string;
  message: string;
  minimumAge: number;
  successRedirect: string;
}

export function AgeGate({ data }: { data: AgeGateData }) {
  return (
    <div className="fixed inset-0 z-50 bg-surface flex items-center justify-center px-8">
      <div className="bg-surface-container p-12 max-w-md w-full text-center border border-outline-variant/30">
        <h2 className="font-headline italic text-3xl text-on-surface mb-6">{data.title}</h2>
        <p className="font-body text-secondary mb-10">{data.message}</p>
        <div className="flex flex-col gap-4">
          <a
            href={data.successRedirect || '#'}
            className="bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all block"
          >
            I am {data.minimumAge}+ — Enter
          </a>
          <button
            className="border border-outline-variant/30 py-4 font-label uppercase text-xs tracking-widest text-on-surface hover:bg-surface-variant transition-all"
            onClick={(e) => e.preventDefault()}
          >
            I am under {data.minimumAge} — Exit
          </button>
        </div>
      </div>
    </div>
  );
}
