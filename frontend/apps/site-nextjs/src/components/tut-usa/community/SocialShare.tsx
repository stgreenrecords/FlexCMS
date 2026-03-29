export interface SocialShareData {
  title: string;
  networks: string[];
  shareUrl: string;
  shareText: string;
}

interface Props {
  data: SocialShareData;
}

const networkColors: Record<string, string> = {
  facebook: 'bg-[#1877F2] text-white',
  x: 'bg-[#000000] text-white',
  twitter: 'bg-[#1DA1F2] text-white',
  linkedin: 'bg-[#0A66C2] text-white',
  email: 'bg-surface-container text-on-surface border border-outline-variant/40',
  whatsapp: 'bg-[#25D366] text-white',
  pinterest: 'bg-[#E60023] text-white',
};

function buildShareUrl(network: string, shareUrl: string, shareText: string): string {
  const encoded = encodeURIComponent(shareUrl);
  const text = encodeURIComponent(shareText);
  switch (network.toLowerCase()) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
    case 'twitter':
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encoded}&text=${text}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`;
    case 'whatsapp':
      return `https://wa.me/?text=${text}%20${encoded}`;
    case 'pinterest':
      return `https://pinterest.com/pin/create/button/?url=${encoded}&description=${text}`;
    case 'email':
      return `mailto:?subject=${text}&body=${encoded}`;
    default:
      return '#';
  }
}

export function SocialShare({ data }: Props) {
  const { title, networks, shareUrl, shareText } = data;

  return (
    <div className="flex flex-col gap-3">
      {title && (
        <span className="font-label uppercase text-xs tracking-widest text-secondary">{title}</span>
      )}
      {networks && networks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {networks.map((network) => {
            const colorClass = networkColors[network.toLowerCase()] ?? 'bg-surface-container text-on-surface border border-outline-variant/40';
            return (
              <a
                key={network}
                href={buildShareUrl(network, shareUrl, shareText)}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-label uppercase text-xs tracking-widest px-3 py-2 rounded hover:opacity-80 transition-opacity ${colorClass}`}
              >
                {network}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
