export interface ClientItem {
  name: string;
  logo: string;
  url?: string;
}

export interface ClientListData {
  title: string;
  clients: ClientItem[];
  sortOrder: string;
}

interface Props {
  data: ClientListData;
}

export function ClientList({ data }: Props) {
  const { title, clients } = data;

  return (
    <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-6">
      {title && (
        <h2 className="font-headline italic text-on-surface text-2xl">{title}</h2>
      )}
      {clients && clients.length > 0 ? (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 list-none p-0">
          {clients.map((client) => {
            const inner = (
              <div className="flex flex-col items-center gap-2">
                {client.logo && (
                  <img
                    src={client.logo}
                    alt={client.name}
                    width={120}
                    height={60}
                    className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                  />
                )}
                <span className="font-label uppercase text-xs tracking-widest text-secondary text-center">
                  {client.name}
                </span>
              </div>
            );
            return (
              <li key={client.name} className="flex items-center justify-center">
                {client.url ? (
                  <a
                    href={client.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2"
                  >
                    {inner}
                  </a>
                ) : inner}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-on-surface-variant">No clients to display.</p>
      )}
    </section>
  );
}
