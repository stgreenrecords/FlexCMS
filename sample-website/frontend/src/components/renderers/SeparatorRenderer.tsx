import type { WkndComponent } from '@/lib/flexcms';

interface Props {
  component: WkndComponent;
}

export function SeparatorRenderer({ component }: Props) {
  return <hr className="my-8 border-gray-200" />;
}
