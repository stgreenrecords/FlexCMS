const safeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');

export interface LessonDetailData {
  title: string;
  body: string;
  durationMinutes: number;
  attachments: string[];
  nextLesson: string;
}

interface Props {
  data: LessonDetailData;
}

export function LessonDetail({ data }: Props) {
  const { title, body, durationMinutes, attachments, nextLesson } = data;

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-outline-variant pb-6">
        <h1 className="font-headline text-3xl text-on-surface leading-tight">{title}</h1>
        <div className="flex items-center gap-2 text-sm text-secondary font-label">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{durationMinutes} min</span>
        </div>
      </header>

      <div
        className="prose prose-sm max-w-none text-on-surface"
        dangerouslySetInnerHTML={{ __html: safeHtml(body) }}
      />

      {attachments.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-label font-semibold text-sm text-secondary uppercase tracking-wider">
            Attachments
          </h2>
          <ul className="flex flex-col gap-2">
            {attachments.map((url, index) => {
              const fileName = url.split('/').pop() ?? `attachment-${index + 1}`;
              return (
                <li key={url}>
                  <a
                    href={url}
                    download
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {fileName}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {nextLesson && (
        <div className="border-t border-outline-variant pt-6 flex justify-end">
          <a
            href={nextLesson}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-surface text-sm font-label font-medium hover:opacity-90 transition-opacity"
            style={{ color: 'var(--color-on-primary)' }}
          >
            Next Lesson
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      )}
    </article>
  );
}
