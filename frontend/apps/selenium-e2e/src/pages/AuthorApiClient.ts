import { loadEnv } from '../driver/env';

interface AuthorNode {
  id?: string;
  name?: string;
  path: string;
  parentPath?: string;
  resourceType?: string;
  status?: string;
  properties?: Record<string, unknown>;
}

interface ContentListResponse {
  content?: Array<{ path?: string; resourceType?: string; properties?: Record<string, unknown> }>;
}

export interface AuthorChildNode {
  id: string;
  name: string;
  path: string;
  parentPath?: string;
  resourceType: string;
  status?: string;
  properties?: Record<string, unknown>;
}

type NodeStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export interface DiscoveredTutUsaPage {
  path: string;
  template: string;
}

export class AuthorApiClient {
  private readonly env = loadEnv();
  private readonly apiBase = this.env.authorApiUrl;
  private readonly publishBase = this.env.publishUrl;
  private readonly graphqlUrl = this.env.authorApiUrl.replace(/\/api$/, '') + '/graphql';
  private readonly defaultSite = process.env.FLEXCMS_DEFAULT_SITE ?? 'tut-usa';
  private readonly defaultLocale = process.env.FLEXCMS_DEFAULT_LOCALE ?? 'en';

  private get headlessHeaders(): Record<string, string> {
    return {
      Accept: 'application/json',
      'X-FlexCMS-Site': this.defaultSite,
      'X-FlexCMS-Locale': this.defaultLocale,
    };
  }

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

  async discoverAllTutUsaPagePaths(): Promise<string[]> {
    const pages = await this.discoverAllTutUsaPages();
    return pages.map((page) => page.path);
  }

  async discoverAllTutUsaPages(): Promise<DiscoveredTutUsaPage[]> {
    // `/author/content/list` is a shallow listing in local runtime and misses
    // deeply nested pages; recurse via children API to discover the full tree.
    const rootPath = 'content.tut-usa';
    const visited = new Set<string>();
    const queue: string[] = [rootPath];
    const discovered: DiscoveredTutUsaPage[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current)) continue;
      visited.add(current);

      const children = await this.getChildren(current);
      for (const child of children) {
        if (!child.path || visited.has(child.path)) continue;

        queue.push(child.path);
        if (child.resourceType !== 'flexcms/page' && child.resourceType !== 'flexcms/site-root') {
          continue;
        }

        discovered.push({
          path: `/${String(child.path).replace(/\./g, '/')}`,
          template: typeof child.properties?.['template'] === 'string' ? String(child.properties['template']) : '',
        });
      }
    }

    const rootNode = await this.getNode('/content/tut-usa');
    if (rootNode.resourceType === 'flexcms/site-root' || rootNode.resourceType === 'flexcms/page') {
      discovered.push({
        path: '/content/tut-usa',
        template: typeof rootNode.properties?.['template'] === 'string' ? String(rootNode.properties['template']) : '',
      });
    }

    const pages = discovered.sort((a, b) => a.path.localeCompare(b.path));

    const uniqueByPath = new Map<string, DiscoveredTutUsaPage>();
    for (const page of pages) {
      uniqueByPath.set(page.path, page);
    }

    const unique = Array.from(uniqueByPath.values());
    if (unique.length === 0) {
      throw new Error('No seeded TUT-USA pages discovered for public-site Selenium tests.');
    }
    return unique;
  }

  async getPageNode(contentPath: string): Promise<AuthorNode> {
    const res = await fetch(`${this.apiBase}/author/content/page?path=${encodeURIComponent(contentPath)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch page node for ${contentPath} (${res.status})`);
    }
    return (await res.json()) as AuthorNode;
  }

  async getNode(path: string): Promise<AuthorNode> {
    const res = await fetch(`${this.apiBase}/author/content/node?path=${encodeURIComponent(path)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch node for ${path} (${res.status})`);
    }
    return (await res.json()) as AuthorNode;
  }

  async getChildren(ltreePath: string): Promise<AuthorChildNode[]> {
    const res = await fetch(`${this.apiBase}/author/content/children?path=${encodeURIComponent(ltreePath)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch children for ${ltreePath} (${res.status})`);
    }
    const json = (await res.json()) as AuthorChildNode[];
    return Array.isArray(json) ? json : [];
  }

  async createNode(input: {
    parentPath: string;
    name: string;
    resourceType: string;
    properties?: Record<string, unknown>;
    userId?: string;
  }): Promise<AuthorNode> {
    const body = {
      parentPath: input.parentPath,
      name: input.name,
      resourceType: input.resourceType,
      properties: input.properties ?? {},
      userId: input.userId ?? 'admin',
    };

    const res = await fetch(`${this.apiBase}/author/content/node`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Failed to create node ${input.parentPath}/${input.name} (${res.status})`);
    }
    return (await res.json()) as AuthorNode;
  }

  async deleteNode(path: string, userId = 'admin'): Promise<void> {
    const res = await fetch(
      `${this.apiBase}/author/content/node?path=${encodeURIComponent(path)}&userId=${encodeURIComponent(userId)}`,
      { method: 'DELETE' },
    );
    if (!res.ok && res.status !== 404) {
      throw new Error(`Failed to delete node ${path} (${res.status})`);
    }
  }

  async updateNodeStatus(path: string, status: NodeStatus, userId = 'admin'): Promise<AuthorNode> {
    const res = await fetch(
      `${this.apiBase}/author/content/node/status?path=${encodeURIComponent(path)}&status=${status}&userId=${encodeURIComponent(userId)}`,
      { method: 'POST' },
    );
    if (!res.ok) {
      throw new Error(`Failed to set status=${status} for ${path} (${res.status})`);
    }
    return (await res.json()) as AuthorNode;
  }

  async bulkPublish(paths: string[], userId = 'admin'): Promise<void> {
    const res = await fetch(`${this.apiBase}/author/content/bulk/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths, userId }),
    });
    if (!res.ok) {
      throw new Error(`Bulk publish failed (${res.status})`);
    }
  }

  async waitForNode(path: string, timeoutMs = 20_000): Promise<AuthorNode> {
    const startedAt = Date.now();
    // Poll until node is visible or timeout is reached.
    while (Date.now() - startedAt < timeoutMs) {
      const res = await fetch(`${this.apiBase}/author/content/node?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        return (await res.json()) as AuthorNode;
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
    throw new Error(`Timed out waiting for node ${path} to exist`);
  }

  async waitForNodeStatus(path: string, status: NodeStatus, timeoutMs = 30_000): Promise<AuthorNode> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const node = await this.getNode(path);
      if (node.status === status) {
        return node;
      }
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
    throw new Error(`Timed out waiting for ${path} to reach status ${status}`);
  }

  async getAuthorRenderedPage(urlPath: string): Promise<Record<string, unknown>> {
    const normalized = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
    const res = await fetch(`${this.apiBase}/content/v1/pages/${normalized}`, {
      headers: this.headlessHeaders,
    });
    if (!res.ok) {
      throw new Error(`Author page fetch failed for ${urlPath} (${res.status})`);
    }
    return (await res.json()) as Record<string, unknown>;
  }

  async getPublishRenderedPage(urlPath: string): Promise<Record<string, unknown>> {
    const normalized = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
    const res = await fetch(`${this.publishBase}/api/content/v1/pages/${normalized}`, {
      headers: this.headlessHeaders,
    });
    if (!res.ok) {
      throw new Error(`Publish page fetch failed for ${urlPath} (${res.status})`);
    }
    return (await res.json()) as Record<string, unknown>;
  }

  async getPublishChildren(urlPath: string): Promise<AuthorChildNode[]> {
    const normalized = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
    const res = await fetch(`${this.publishBase}/api/content/v1/pages/children/${normalized}`);
    if (!res.ok) {
      throw new Error(`Publish children fetch failed for ${urlPath} (${res.status})`);
    }
    const json = (await res.json()) as { children?: AuthorChildNode[] };
    return Array.isArray(json.children) ? json.children : [];
  }

  async waitForPublishChild(parentUrlPath: string, childName: string, timeoutMs = 45_000): Promise<AuthorChildNode[]> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const children = await this.getPublishChildren(parentUrlPath);
      if (children.some((node) => node.name === childName)) {
        return children;
      }
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
    throw new Error(`Timed out waiting for publish child ${childName} under ${parentUrlPath}`);
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

  static toLtreePath(path: string): string {
    const withoutLeadingSlash = path.startsWith('/') ? path.slice(1) : path;
    const dotted = withoutLeadingSlash.replace(/\//g, '.');
    return dotted.startsWith('content.') ? dotted : `content.${dotted}`;
  }
}

