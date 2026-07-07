import { loadEnv } from '../driver/env';

interface AuthorNode {
  path: string;
  status?: string;
  properties?: Record<string, unknown>;
}

interface ContentListResponse {
  content?: Array<{ path?: string; resourceType?: string }>;
}

export class AuthorApiClient {
  private readonly env = loadEnv();
  private readonly apiBase = this.env.authorApiUrl;
  private readonly graphqlUrl = this.env.authorApiUrl.replace(/\/api$/, '') + '/graphql';

  async discoverTargetPagePath(): Promise<string> {
    const preferred = ['/content/tut-usa/home', '/content/tut-usa'];
    for (const candidate of preferred) {
      const res = await fetch(`${this.apiBase}/author/content/page?path=${encodeURIComponent(candidate)}`);
      if (res.ok) return candidate;
    }

    const listRes = await fetch(`${this.apiBase}/author/content/list?page=0&size=200`);
    if (!listRes.ok) {
      throw new Error(`Failed to list content nodes (${listRes.status})`);
    }

    const payload = (await listRes.json()) as ContentListResponse;
    const pageNode = (payload.content ?? []).find((item) => {
      if (!item.path || !item.resourceType) return false;
      if (!item.path.startsWith('content.tut-usa')) return false;
      return item.resourceType === 'flexcms/page' || item.resourceType === 'flexcms/site-root';
    });

    if (!pageNode?.path) {
      throw new Error('Could not discover a TUT-USA page path for REB-13 selenium tests.');
    }

    return `/${pageNode.path.replace(/\./g, '/')}`;
  }

  async getPageNode(contentPath: string): Promise<AuthorNode> {
    const res = await fetch(`${this.apiBase}/author/content/page?path=${encodeURIComponent(contentPath)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch page node for ${contentPath} (${res.status})`);
    }
    return (await res.json()) as AuthorNode;
  }

  async getGraphqlPageTitle(urlPath: string): Promise<string> {
    const body = {
      query: `query($path: String!) { page(path: $path) { title } }`,
      variables: { path: urlPath },
    };

    const res = await fetch(this.graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`GraphQL page query failed (${res.status})`);
    }

    const json = (await res.json()) as { data?: { page?: { title?: string | null } } };
    const title = json.data?.page?.title;
    if (!title) throw new Error(`GraphQL page title missing for path ${urlPath}`);
    return title;
  }

  static toSitePath(contentPath: string): string {
    if (!contentPath.startsWith('/content/')) {
      return contentPath.startsWith('/') ? contentPath : `/${contentPath}`;
    }
    return contentPath.replace(/^\/content/, '');
  }
}

