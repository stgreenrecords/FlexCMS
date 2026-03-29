'use client';

import { useEffect, useState } from 'react';
import { TutUsaNavigation } from './navigation/Navigation';

const CMS_API =
  process.env.NEXT_PUBLIC_FLEXCMS_API_URL ??
  process.env.NEXT_PUBLIC_FLEXCMS_API ??
  '';

interface Props {
  /** ltree-style path to the XF content node, e.g. "content/experience-fragments/tut-usa/global/navigation" */
  xfPath: string;
}

/**
 * Resolves an Experience Fragment by path and renders the TUT USA Navigation.
 * Navigation is injected at layout level — it is NOT part of per-page component data.
 */
export function XfNavigation({ xfPath }: Props) {
  const [xfData, setXfData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const ltreePath = xfPath.replace(/\//g, '.');
    fetch(`${CMS_API}/api/author/content/node?path=${encodeURIComponent(ltreePath)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((node) => {
        if (node?.properties) setXfData(node.properties);
      })
      .catch(() => {
        // Backend not available — render with empty data (fallbacks apply)
      });
  }, [xfPath]);

  return <TutUsaNavigation data={xfData} />;
}
