import type { WkndComponent } from '@/lib/flexcms';
import { ComponentRenderer } from '../ComponentRenderer';

interface Props {
  component: WkndComponent;
}

export function ContainerRenderer({ component }: Props) {
  const children = component.children ?? [];
  const layout = (component.data?.layout as string) ?? 'default';

  if (layout === 'responsiveGrid') {
    return (
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        {children.map((c, i) => (
          <ComponentRenderer key={i} component={c} />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      {children.map((c, i) => (
        <ComponentRenderer key={i} component={c} />
      ))}
    </div>
  );
}
