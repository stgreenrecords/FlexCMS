export interface ExpoBoothInfoData {
  boothNumber: string;
  hall: string;
  eventName: string;
  meetingUrl: string;
}

export function ExpoBoothInfo({ data }: { data: ExpoBoothInfoData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-8">
      <span className="font-label uppercase text-xs tracking-[0.3em] text-primary block mb-4">Find Us</span>
      {data.eventName && (
        <h3 className="font-headline italic text-2xl text-on-surface mb-6">{data.eventName}</h3>
      )}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {data.boothNumber && (
          <div>
            <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">Booth</span>
            <span className="font-headline text-3xl text-primary">{data.boothNumber}</span>
          </div>
        )}
        {data.hall && (
          <div>
            <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-1">Hall</span>
            <span className="font-headline text-3xl text-on-surface">{data.hall}</span>
          </div>
        )}
      </div>
      {data.meetingUrl && (
        <a href={data.meetingUrl} className="inline-block bg-primary text-on-primary px-8 py-3 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all">
          Book a Meeting
        </a>
      )}
    </div>
  );
}
