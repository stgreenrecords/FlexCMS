export interface ChatWidgetData {
  title: string;
  provider: string;
  offlineMessage: string;
  routingRule: string;
}

interface Props {
  data: ChatWidgetData;
}

export function ChatWidget({ data }: Props) {
  const { title, provider, offlineMessage, routingRule } = data;

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/40 overflow-hidden flex flex-col w-72 shadow-lg">
      {/* Chat header */}
      <div className="bg-primary text-on-primary px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-on-primary opacity-80 animate-pulse" />
          <span className="font-headline italic text-base">{title || 'Live Chat'}</span>
        </div>
        <span className="font-label uppercase text-xs tracking-widest opacity-70">
          {provider || 'Chat'}
        </span>
      </div>
      {/* Chat body placeholder */}
      <div className="bg-surface-container-low p-4 flex flex-col gap-3 flex-1 min-h-32">
        {offlineMessage && (
          <div className="bg-surface-container rounded-lg px-3 py-2 text-sm text-on-surface-variant self-start max-w-[80%]">
            {offlineMessage}
          </div>
        )}
        {routingRule && (
          <p className="font-label uppercase text-xs tracking-widest text-secondary mt-auto">
            Route: {routingRule}
          </p>
        )}
      </div>
      {/* Chat input chrome */}
      <div className="border-t border-outline-variant/40 px-3 py-2 flex items-center gap-2 bg-surface-container">
        <div className="flex-1 h-8 rounded bg-surface-container-low border border-outline-variant/40" />
        <button
          type="button"
          className="bg-primary text-on-primary font-label uppercase text-xs tracking-widest px-3 py-1.5 rounded hover:bg-primary-fixed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
