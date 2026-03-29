export interface VirtualAssistantData {
  title: string;
  botEndpoint: string;
  welcomeMessage: string;
  fallbackContact: string;
}

interface Props {
  data: VirtualAssistantData;
}

export function VirtualAssistant({ data }: Props) {
  const { title, welcomeMessage, fallbackContact } = data;

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/40 overflow-hidden flex flex-col w-80 shadow-lg">
      {/* Header */}
      <div className="bg-primary text-on-primary px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-on-primary/20 flex items-center justify-center text-on-primary text-sm font-bold flex-shrink-0">
          AI
        </div>
        <div className="flex flex-col">
          <span className="font-headline italic text-base leading-tight">{title || 'Virtual Assistant'}</span>
          <span className="font-label uppercase text-xs tracking-widest opacity-70">Online</span>
        </div>
      </div>
      {/* Conversation area */}
      <div className="bg-surface-container-low p-4 flex flex-col gap-3 min-h-48">
        {welcomeMessage && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs flex-shrink-0 mt-0.5">
              AI
            </div>
            <div className="bg-surface-container rounded-lg rounded-tl-none px-3 py-2 text-sm text-on-surface max-w-[80%]">
              {welcomeMessage}
            </div>
          </div>
        )}
        {fallbackContact && (
          <p className="text-xs text-on-surface-variant mt-auto pt-2 border-t border-outline-variant/40">
            Need more help?{' '}
            <a href={`mailto:${fallbackContact}`} className="text-primary hover:underline">
              {fallbackContact}
            </a>
          </p>
        )}
      </div>
      {/* Input */}
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
