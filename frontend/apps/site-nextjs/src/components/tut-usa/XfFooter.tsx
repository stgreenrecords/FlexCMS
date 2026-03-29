'use client';

import { useEffect, useState } from 'react';
import { TutUsaFooter } from './navigation/TutUsaFooter';

const CMS_API = process.env.NEXT_PUBLIC_FLEXCMS_API_URL ?? 'http://localhost:8080';

interface Props {
  /** ltree-style path to the XF content node, e.g. "content/experience-fragments/tut-usa/global/footer" */
  xfPath: string;
}

/**
 * Resolves an Experience Fragment by path and renders the TUT USA Footer.
 * Footer is injected at layout level — it is NOT part of per-page component data.
 */
export function XfFooter({ xfPath }: Props) {
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

  return <TutUsaFooter data={xfData} />;
}
