// =============================================================================
// FlexCMS GraphQL client for the WKND sample website
// =============================================================================

const FLEXCMS_GRAPHQL =
  process.env.NEXT_PUBLIC_FLEXCMS_API ?? 'http://localhost:8080/graphql';

export interface WkndComponent {
  name: string;
  resourceType: string;
  data?: Record<string, unknown>;
  children?: WkndComponent[];
}

export interface WkndNode {
  path: string;
  name: string;
  resourceType: string;
  properties: {
    title?: string;
    pageTitle?: string;
    description?: string;
    template?: string;
    thumbnail?: string;
    tags?: string[];
    // adventure-specific
    activity?: string;
    adventureType?: string;
    tripLength?: string;
    groupSize?: string;
    difficulty?: string;
    price?: string;
    // XF
    xfVariantType?: string;
    xfMasterVariation?: boolean;
    components?: WkndComponent[];
    [key: string]: unknown;
  } | null;
}

const NODE_QUERY = `
  query GetNode($path: String!) {
    node(path: $path) {
      path
      name
      resourceType
      properties
    }
  }
`;

const CHILDREN_QUERY = `
  query GetChildren($path: String!) {
    node(path: $path) {
      path
      name
      resourceType
      properties
      children {
        path
        name
        resourceType
        properties
      }
    }
  }
`;

export async function getNode(path: string): Promise<WkndNode | null> {
  // FlexCMS paths use dots; convert URL path (slashes) to dots
  const dotPath = path.replace(/^\//, '').replace(/\//g, '.');
  try {
    const res = await fetch(FLEXCMS_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: NODE_QUERY, variables: { path: dotPath } }),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data?.node as WkndNode) ?? null;
  } catch {
    return null;
  }
}

export async function getChildren(path: string): Promise<WkndNode[]> {
  const dotPath = path.replace(/^\//, '').replace(/\//g, '.');
  try {
    const res = await fetch(FLEXCMS_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: CHILDREN_QUERY, variables: { path: dotPath } }),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data?.node?.children as WkndNode[]) ?? [];
  } catch {
    return [];
  }
}

/** Convert a FlexCMS dot-path back to a URL path */
export function dotPathToUrl(dotPath: string): string {
  return '/' + dotPath.replace(/\./g, '/');
}

/** Convert a URL path to a FlexCMS dot-path, stripping leading slash */
export function urlToDotPath(urlPath: string): string {
  return urlPath.replace(/^\//, '').replace(/\//g, '.');
}
