'use client';

import type { WkndComponent } from '@/lib/flexcms';
import { COMPONENT_MAP } from './component-map';

interface Props {
  component: WkndComponent;
}

export function ComponentRenderer({ component }: Props) {
  const Renderer = COMPONENT_MAP[component.resourceType];
  if (!Renderer) {
    // Unknown component — render nothing in production
    return null;
  }
  return <Renderer component={component} />;
}
