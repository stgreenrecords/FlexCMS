export interface PodcastEpisodeData {
  episodeTitle: string;
  summary: string;
  /** Audio file — N/A */
  audioFile: string;
  duration: number;
  subscribeLink: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function PodcastEpisode({ data }: { data: PodcastEpisodeData }) {
  return (
    <section className="py-8 bg-surface">
      <div className="bg-surface-container-low rounded-lg p-6">
        {data.episodeTitle && (
          <h3 className="text-xl font-semibold text-on-surface mb-2">
            {data.episodeTitle}
          </h3>
        )}
        {data.duration > 0 && (
          <p className="text-xs text-on-surface-variant mb-3">
            Duration: {formatDuration(data.duration)}
          </p>
        )}
        {data.summary && (
          <p className="text-on-surface-variant text-sm mb-4">{data.summary}</p>
        )}
        <audio
          src={data.audioFile}
          controls
          className="w-full mb-4"
          aria-label={data.episodeTitle}
        />
        {data.subscribeLink && (
          <a
            href={data.subscribeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-primary text-sm underline"
          >
            Subscribe to Podcast
          </a>
        )}
      </div>
    </section>
  );
}
