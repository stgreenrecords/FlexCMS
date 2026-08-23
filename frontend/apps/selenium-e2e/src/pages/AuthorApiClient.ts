import { loadEnv } from '../driver/env';

interface AuthorNode {
  id?: string;
  name?: string;
  path: string;
  parentPath?: string;
  resourceType?: string;
  status?: string;
  properties?: Record<string, unknown>;
  /** ISO instant the scheduler will publish this node at, or null when unscheduled. */
  scheduledPublishAt?: string | null;
  /** ISO instant the scheduler will deactivate this node at, or null when unscheduled. */
  scheduledDeactivateAt?: string | null;
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

export interface AuthorTemplateDefinition {
  name: string;
  title?: string;
  description?: string;
  resourceType?: string;
  embeddedComponentTypes?: string[];
  allowedComponentTypes?: string[];
}

export interface RegistryComponent {
  resourceType: string;
  name: string;
  title?: string;
  group?: string;
  isContainer?: boolean;
  dataSchema?: Record<string, unknown>;
}

export interface DiscoveredTutUsaPage {
  path: string;
  template: string;
}

/** Workflow instance as `AuthorWorkflowController` serialises it (REB-20). */
export interface WorkflowInstance {
  id: string;
  workflowName: string;
  /** Always the ltree form — the workflow controller does not normalise paths. */
  contentPath: string;
  contentNodeId?: string;
  currentStepId?: string;
  previousStepId?: string;
  status: WorkflowStatus;
  startedBy?: string;
  startedAt?: string;
  lastAction?: string;
  lastActionBy?: string;
  lastActionAt?: string;
  lastComment?: string | null;
  completedAt?: string | null;
}

export type WorkflowStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

/** Asset metadata as `AuthorAssetController` serialises it (REB-21). */
export interface DamAsset {
  id: string;
  path?: string;
  filename?: string;
  name?: string;
  mimeType?: string;
  fileSize?: number;
  siteId?: string;
  storageKey?: string;
  status?: string;
  createdBy?: string;
  createdAt?: string;
}

/** Envelope shared by the asset list and folder endpoints. */
export interface DamAssetPage {
  items: DamAsset[];
  totalCount: number;
  page: number;
  size: number;
  hasNextPage: boolean;
}

/** `BulkOperationResult` as the author API serialises it (REB-20). */
export interface BulkOperationResult {
  succeeded: number;
  failed: number;
  total: number;
  errors: string[];
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

  async updateNodeProperties(
    path: string,
    properties: Record<string, unknown>,
    userId = 'admin',
  ): Promise<AuthorNode> {
    const res = await fetch(`${this.apiBase}/author/content/node/properties`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, properties, userId }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update properties for ${path} (${res.status})`);
    }
    return (await res.json()) as AuthorNode;
  }

  /** Template definition, including embedded and allowed component types. */
  async getTemplate(templateName: string): Promise<AuthorTemplateDefinition> {
    const res = await fetch(`${this.apiBase}/author/content/templates/${encodeURIComponent(templateName)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch template ${templateName} (${res.status})`);
    }
    return (await res.json()) as AuthorTemplateDefinition;
  }

  /** Component registry entries, i.e. the schemas the editor renders from. */
  async getComponentRegistry(): Promise<RegistryComponent[]> {
    const res = await fetch(`${this.apiBase}/content/v1/component-registry`, {
      headers: this.headlessHeaders,
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch component registry (${res.status})`);
    }
    const json = (await res.json()) as RegistryComponent[] | { components?: RegistryComponent[] };
    return Array.isArray(json) ? json : (json.components ?? []);
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

  /**
   * Publishes every path in one call and returns the per-path result counts.
   *
   * Existing callers ignore the return value; REB-20 asserts on it, which is why
   * the parsed `BulkOperationResult` is handed back instead of `void`.
   */
  async bulkPublish(paths: string[], userId = 'admin'): Promise<BulkOperationResult> {
    return this.bulkRequest('POST', 'bulk/publish', { paths, userId }, 'Bulk publish');
  }

  /** Deletes every path and its descendants in one call (REB-20). */
  async bulkDelete(paths: string[], userId = 'admin'): Promise<BulkOperationResult> {
    return this.bulkRequest('DELETE', 'bulk', { paths, userId }, 'Bulk delete');
  }

  /** Moves every path under one target parent in one call (REB-20). */
  async bulkMove(paths: string[], targetParentPath: string, userId = 'admin'): Promise<BulkOperationResult> {
    return this.bulkRequest('POST', 'bulk/move', { paths, targetParentPath, userId }, 'Bulk move');
  }

  /** Shared shape for the three bulk endpoints, which differ only in verb and body. */
  private async bulkRequest(
    method: 'POST' | 'DELETE',
    endpoint: string,
    body: Record<string, unknown>,
    label: string,
  ): Promise<BulkOperationResult> {
    const res = await fetch(`${this.apiBase}/author/content/${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`${label} failed (${res.status})`);
    }
    const json = (await res.json()) as Partial<BulkOperationResult>;
    return {
      succeeded: json.succeeded ?? 0,
      failed: json.failed ?? 0,
      total: json.total ?? 0,
      errors: json.errors ?? [],
    };
  }

  // -- Workflow (REB-20) ----------------------------------------------------
  //
  // `AuthorWorkflowController` passes `contentPath` straight to the engine, which
  // looks the node up by exact path -- so every workflow call takes the **ltree**
  // form (`content.tut-usa.page`), not the `/content/...` URL form the content
  // endpoints normalise for you.

  async startWorkflow(
    contentLtreePath: string,
    workflowName = 'standard-publish',
    userId = 'admin',
  ): Promise<WorkflowInstance> {
    const res = await fetch(`${this.apiBase}/author/workflow/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowName, contentPath: contentLtreePath, userId }),
    });
    if (!res.ok) {
      throw new Error(`Failed to start workflow '${workflowName}' for ${contentLtreePath} (${res.status})`);
    }
    return (await res.json()) as WorkflowInstance;
  }

  async advanceWorkflow(
    instanceId: string,
    action: string,
    userId = 'admin',
    comment = '',
  ): Promise<WorkflowInstance> {
    const res = await fetch(`${this.apiBase}/author/workflow/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId, action, userId, comment }),
    });
    if (!res.ok) {
      throw new Error(`Failed to advance workflow ${instanceId} via '${action}' (${res.status})`);
    }
    return (await res.json()) as WorkflowInstance;
  }

  async cancelWorkflow(instanceId: string, userId = 'admin', reason = 'REB-20 cleanup'): Promise<WorkflowInstance> {
    const query =
      `instanceId=${encodeURIComponent(instanceId)}` +
      `&userId=${encodeURIComponent(userId)}` +
      `&reason=${encodeURIComponent(reason)}`;
    const res = await fetch(`${this.apiBase}/author/workflow/cancel?${query}`, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Failed to cancel workflow ${instanceId} (${res.status})`);
    }
    return (await res.json()) as WorkflowInstance;
  }

  async listWorkflows(status: WorkflowStatus, size = 200): Promise<WorkflowInstance[]> {
    return this.workflowPage(`list?status=${status}&size=${size}`, `list status=${status}`);
  }

  /** The inbox the admin workflows page reads. */
  async listWorkflowsForUser(userId = 'admin', size = 200): Promise<WorkflowInstance[]> {
    return this.workflowPage(`for-user?userId=${encodeURIComponent(userId)}&size=${size}`, `for-user ${userId}`);
  }

  private async workflowPage(query: string, label: string): Promise<WorkflowInstance[]> {
    const res = await fetch(`${this.apiBase}/author/workflow/${query}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch workflow ${label} (${res.status})`);
    }
    const json = (await res.json()) as { content?: WorkflowInstance[] } | WorkflowInstance[];
    if (Array.isArray(json)) return json;
    return json.content ?? [];
  }

  /** The active workflow for a path, or `null` when the API answers 404. */
  async getActiveWorkflow(contentLtreePath: string): Promise<WorkflowInstance | null> {
    const res = await fetch(
      `${this.apiBase}/author/workflow/active?contentPath=${encodeURIComponent(contentLtreePath)}`,
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to fetch active workflow for ${contentLtreePath} (${res.status})`);
    }
    return (await res.json()) as WorkflowInstance;
  }

  // -- Scheduling (REB-20) --------------------------------------------------

  /** Schedules (or, with `null`, clears) a future publish. */
  async schedulePublish(path: string, publishAt: Date | null): Promise<void> {
    await this.scheduleRequest('schedule-publish', 'publishAt', path, publishAt, 'schedule publish');
  }

  /** Schedules (or, with `null`, clears) a future deactivation. */
  async scheduleDeactivate(path: string, deactivateAt: Date | null): Promise<void> {
    await this.scheduleRequest('schedule-deactivate', 'deactivateAt', path, deactivateAt, 'schedule deactivate');
  }

  private async scheduleRequest(
    endpoint: string,
    param: string,
    path: string,
    at: Date | null,
    label: string,
  ): Promise<void> {
    const query = at
      ? `path=${encodeURIComponent(path)}&${param}=${encodeURIComponent(at.toISOString())}`
      : `path=${encodeURIComponent(path)}`;
    const res = await fetch(`${this.apiBase}/author/content/node/${endpoint}?${query}`, { method: 'PUT' });
    if (!res.ok) {
      throw new Error(`Failed to ${label} for ${path} (${res.status})`);
    }
  }

  /**
   * Waits until the scheduler has consumed a schedule, i.e. cleared the node's
   * `scheduledPublishAt` / `scheduledDeactivateAt`.
   *
   * `ScheduledPublishingService` polls on a 60 s `fixedDelay`, so the default
   * timeout allows for two cycles plus replication.
   */
  async waitForScheduleProcessed(
    path: string,
    field: 'scheduledPublishAt' | 'scheduledDeactivateAt',
    timeoutMs = 180_000,
  ): Promise<AuthorNode> {
    const startedAt = Date.now();
    let node = await this.getNode(path);
    while (Date.now() - startedAt < timeoutMs) {
      if (!node[field]) return node;
      await new Promise((resolve) => setTimeout(resolve, 3_000));
      node = await this.getNode(path);
    }
    throw new Error(
      `Timed out after ${timeoutMs} ms waiting for the scheduler to consume ${field} on ${path} ` +
        `(still ${String(node[field])})`,
    );
  }

  /** Raw HTTP status of a publish-environment page, for retraction checks. */
  async getPublishPageStatus(urlPath: string): Promise<number> {
    const normalized = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
    const res = await fetch(`${this.publishBase}/api/content/v1/pages/${normalized}`, {
      headers: this.headlessHeaders,
    });
    return res.status;
  }

  /** Whether the publish service answers its health probe (AC1, scenario 10). */
  async isPublishServiceReachable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.publishBase}/actuator/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Polls the publish delivery API until it serves `marker`, or gives up. */
  async waitForPublishMarker(urlPath: string, marker: string, timeoutMs = 120_000): Promise<boolean> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      try {
        const payload = await this.getPublishRenderedPage(urlPath);
        if (JSON.stringify(payload).includes(marker)) return true;
      } catch {
        // A page that has not replicated yet answers 500, not 404 -- keep polling.
      }
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
    return false;
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

  // -- DAM (REB-21) ---------------------------------------------------------

  /**
   * Uploads a binary to the DAM.
   *
   * The endpoint is `multipart/form-data` with the binary in `file` and the rest
   * as query parameters, so the body is a `FormData` and `Content-Type` is left to
   * the runtime — setting it by hand drops the multipart boundary.
   */
  async uploadAsset(input: {
    bytes: Uint8Array;
    filename: string;
    contentType: string;
    path: string;
    siteId?: string;
    userId?: string;
  }): Promise<DamAsset> {
    const siteId = input.siteId ?? this.defaultSite;
    const userId = input.userId ?? 'admin';
    const query =
      `path=${encodeURIComponent(input.path)}` +
      `&siteId=${encodeURIComponent(siteId)}` +
      `&userId=${encodeURIComponent(userId)}`;

    const form = new FormData();
    form.append('file', new Blob([input.bytes], { type: input.contentType }), input.filename);

    const res = await fetch(`${this.apiBase}/author/assets?${query}`, { method: 'POST', body: form });
    if (!res.ok) {
      throw new Error(`Asset upload failed for ${input.path} (${res.status})`);
    }
    return (await res.json()) as DamAsset;
  }

  /** Upload attempt that returns the status instead of throwing (negative cases). */
  async tryUploadAsset(input: {
    bytes: Uint8Array;
    filename: string;
    contentType: string;
    path: string;
    siteId?: string;
    userId?: string;
  }): Promise<{ status: number; asset?: DamAsset; body: string }> {
    const siteId = input.siteId ?? this.defaultSite;
    const userId = input.userId ?? 'admin';
    const query =
      `path=${encodeURIComponent(input.path)}` +
      `&siteId=${encodeURIComponent(siteId)}` +
      `&userId=${encodeURIComponent(userId)}`;

    const form = new FormData();
    form.append('file', new Blob([input.bytes], { type: input.contentType }), input.filename);

    const res = await fetch(`${this.apiBase}/author/assets?${query}`, { method: 'POST', body: form });
    const body = await res.text();
    if (!res.ok) return { status: res.status, body };
    return { status: res.status, asset: JSON.parse(body) as DamAsset, body };
  }

  async getAsset(id: string): Promise<DamAsset> {
    const res = await fetch(`${this.apiBase}/author/assets/${encodeURIComponent(id)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch asset ${id} (${res.status})`);
    }
    return (await res.json()) as DamAsset;
  }

  /** Raw status for an asset lookup, for existence checks after delete. */
  async getAssetStatus(id: string): Promise<number> {
    const res = await fetch(`${this.apiBase}/author/assets/${encodeURIComponent(id)}`);
    return res.status;
  }

  /** Streams an asset's bytes, returning the payload and its declared type. */
  async getAssetContent(id: string): Promise<{ status: number; contentType: string; bytes: Uint8Array }> {
    const res = await fetch(`${this.apiBase}/author/assets/${encodeURIComponent(id)}/content`);
    const buffer = res.ok ? new Uint8Array(await res.arrayBuffer()) : new Uint8Array();
    return {
      status: res.status,
      contentType: res.headers.get('content-type') ?? '',
      bytes: buffer,
    };
  }

  /** Lists assets with no keyword, which the API serves across every site. */
  async listAssets(page = 0, size = 200): Promise<DamAssetPage> {
    return this.assetPage(`author/assets?page=${page}&size=${size}`, 'list assets');
  }

  /** Keyword search with an explicit site — see the note on the API's default. */
  async searchAssets(query: string, siteId?: string, page = 0, size = 200): Promise<DamAssetPage> {
    const site = siteId ?? this.defaultSite;
    return this.assetPage(
      `author/assets?q=${encodeURIComponent(query)}&siteId=${encodeURIComponent(site)}&page=${page}&size=${size}`,
      `search assets q=${query} site=${site}`,
    );
  }

  /** Keyword search with **no** siteId, which the API silently scopes to "corporate". */
  async searchAssetsWithoutSite(query: string, page = 0, size = 200): Promise<DamAssetPage> {
    return this.assetPage(
      `author/assets?q=${encodeURIComponent(query)}&page=${page}&size=${size}`,
      `search assets q=${query} (no siteId)`,
    );
  }

  async listAssetFolder(folderPath: string, siteId?: string, page = 0, size = 200): Promise<DamAssetPage> {
    const site = siteId ?? this.defaultSite;
    return this.assetPage(
      `author/assets/folder?folderPath=${encodeURIComponent(folderPath)}` +
        `&siteId=${encodeURIComponent(site)}&page=${page}&size=${size}`,
      `list folder ${folderPath}`,
    );
  }

  /**
   * Keyword search that reports the HTTP status instead of throwing.
   *
   * The endpoint currently answers 500 for every keyword (`AssetRepository.search`
   * references a `tags` column the `assets` table does not have), so the suite has
   * to be able to record that rather than die on it.
   */
  async trySearchAssets(
    query: string,
    siteId?: string,
    page = 0,
    size = 200,
  ): Promise<{ status: number; page?: DamAssetPage }> {
    const site = siteId ? `&siteId=${encodeURIComponent(siteId)}` : '';
    const res = await fetch(
      `${this.apiBase}/author/assets?q=${encodeURIComponent(query)}${site}&page=${page}&size=${size}`,
    );
    if (!res.ok) return { status: res.status };
    const json = (await res.json()) as Partial<DamAssetPage>;
    return {
      status: res.status,
      page: {
        items: json.items ?? [],
        totalCount: json.totalCount ?? 0,
        page: json.page ?? 0,
        size: json.size ?? 0,
        hasNextPage: json.hasNextPage ?? false,
      },
    };
  }

  private async assetPage(query: string, label: string): Promise<DamAssetPage> {
    const res = await fetch(`${this.apiBase}/${query}`);
    if (!res.ok) {
      throw new Error(`Failed to ${label} (${res.status})`);
    }
    const json = (await res.json()) as Partial<DamAssetPage>;
    return {
      items: json.items ?? [],
      totalCount: json.totalCount ?? 0,
      page: json.page ?? 0,
      size: json.size ?? 0,
      hasNextPage: json.hasNextPage ?? false,
    };
  }

  /** Deletes an asset **by path** — the endpoint takes no id. */
  async deleteAsset(path: string): Promise<number> {
    const res = await fetch(`${this.apiBase}/author/assets?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });
    return res.status;
  }

  /** Absolute URL of an asset's binary, as the admin UI builds it for previews. */
  assetContentUrl(id: string): string {
    return `${this.apiBase}/author/assets/${id}/content`;
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

