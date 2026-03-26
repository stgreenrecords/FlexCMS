import { getNode } from '@/lib/flexcms';
import { ComponentRenderer } from '../ComponentRenderer';

interface Props {
  component: {
    name: string;
    resourceType: string;
    data?: Record<string, unknown>;
    children?: unknown[];
  };
}

export async function ExperienceFragmentRenderer({ component }: Props) {
  const fragmentPath = (component.data?.fragmentVariationPath as string) ?? '';
  if (!fragmentPath) return null;

  // fragmentVariationPath is a dot-path like experience-fragments.wknd...
  const node = await getNode(fragmentPath);
  if (!node) return null;

  const xfComponents = node.properties?.components ?? [];
  if (!xfComponents.length) return null;

  return (
    <>
      {xfComponents.map((c, i) => (
        <ComponentRenderer key={i} component={c} />
      ))}
    </>
  );
}
