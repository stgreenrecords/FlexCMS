export interface AudioPlayerData {
  title: string;
  /** Audio file — N/A (audio asset) */
  audioFile: string;
  description: string;
  showDownload: boolean;
}

export function AudioPlayer({ data }: { data: AudioPlayerData }) {
  return (
    <section className="py-8 bg-surface">
      <div className="bg-surface-container-low rounded-lg p-6">
        {data.title && (
          <h3 className="text-lg font-semibold text-on-surface mb-2">{data.title}</h3>
        )}
        {data.description && (
          <p className="text-on-surface-variant text-sm mb-4">{data.description}</p>
        )}
        <audio
          src={data.audioFile}
          controls
          className="w-full"
          aria-label={data.title}
        />
        {data.showDownload && data.audioFile && (
          <a
            href={data.audioFile}
            download
            className="inline-block mt-3 text-primary text-sm underline"
          >
            Download Audio
          </a>
        )}
      </div>
    </section>
  );
}
