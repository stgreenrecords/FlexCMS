/**
 * DependencyResolver — Given a replication event, determines which pages
 * need to be recompiled based on the dependency graph.
 *
 * This is the core of incremental compilation: only changed pages are rebuilt.
 */
import { FlexCmsClient } from '@flexcms/sdk';
import type { ReplicationEvent } from './event-consumer';
import type { BuildWorkerConfig } from './index';
import { BuildDependencyClient } from './build-dependency-client';
import { createLogger } from './logger';

const log = createLogger('dependency-resolver');

export class DependencyResolver {
  private client: FlexCmsClient;
  private depClient: BuildDependencyClient;

  constructor(private config: BuildWorkerConfig) {
    this.client = new FlexCmsClient({ apiUrl: config.cmsApiUrl });
    this.depClient = new BuildDependencyClient(config);
  }

  /**
   * Resolve which page paths need recompilation for a given event.
   */
  async resolve(event: ReplicationEvent): Promise<string[]> {
    // Deactivate/Delete — remove from S3, no rebuild needed
    if (event.action === 'DEACTIVATE' || event.action === 'DELETE') {
      return []; // Handled separately by the purge path
    }

    switch (event.type) {
      case 'CONTENT':
        return this.resolveContentChange(event);
      case 'TREE':
        return this.resolveTreeChange(event);
      case 'ASSET':
        return this.resolveAssetChange(event);
      default:
        log.warn({ type: event.type }, 'Unknown event type');
        return [];
    }
  }

  /**
   * Single content node changed → determine scope:
   * - If it's a page node: recompile just that page
   * - If it's a shared component (header/footer): recompile all pages in the site
   * - If it's a child component: find the parent page and recompile it
   */
  private async resolveContentChange(event: ReplicationEvent): Promise<string[]> {
    const { path, resourceType, siteId, locale } = event;

    // Shared components affect all pages in the site
    if (resourceType?.startsWith('flexcms/shared-')) {
      log.info({ resourceType, siteId }, 'Shared component changed — full site rebuild');
      return this.getAllPagePaths(siteId, locale);
    }

    // Page node — recompile just this page
    if (resourceType === 'flexcms/page') {
      return [path];
    }

    // Child component — find parent page
    const pagePath = this.findParentPagePath(path);
    if (pagePath) {
      return [pagePath];
    }

    // Navigation-affecting change (site root) — all pages
    if (resourceType === 'flexcms/site-root') {
      return this.getAllPagePaths(siteId, locale);
    }

    // Default: recompile the path itself
    return [path];
  }

  /**
   * Tree activation — recompile all pages in the subtree.
   */
  private async resolveTreeChange(event: ReplicationEvent): Promise<string[]> {
    const pages = event.affectedPaths?.filter((p) => this.looksLikePage(p)) ?? [];
    return pages.length > 0 ? pages : [event.path];
  }

  /**
   * Asset changed — find all pages that reference this asset via the dependency graph.
   *
   * Queries the backend {@code static_build_dependencies} table for pages that
   * recorded an ASSET dependency on this path during their last render.
   *
   * Falls back gracefully to an empty list if the graph is not yet populated
   * (e.g. first run before any page has been compiled) — the content node's
   * version will already change when an inline asset reference is edited, so the
   * page-change event typically triggers the rebuild anyway.
   */
  private async resolveAssetChange(event: ReplicationEvent): Promise<string[]> {
    const { path, siteId, locale } = event;
    log.info({ assetPath: path, siteId, locale }, 'Asset changed — querying dependency graph');

    const pages = await this.depClient.findPagesForAsset(siteId, locale, path);

    if (pages.length > 0) {
      log.info({ assetPath: path, count: pages.length, pages: pages.slice(0, 5) },
        'Dependency graph: pages depending on asset');
    } else {
      log.info({ assetPath: path },
        'No pages depend on this asset in the graph — skipping rebuild');
    }

    return pages;
  }

  /**
   * Get all page paths for a site/locale.
   * Calls the FlexCMS API to list all pages.
   */
  private async getAllPagePaths(siteId: string, locale: string): Promise<string[]> {
    try {
      const nav = await this.client.getNavigation(siteId, locale, 10);
      const paths: string[] = [];
      const collect = (items: any[]) => {
        for (const item of items) {
          if (item.path) paths.push(item.path);
          if (item.children) collect(item.children);
        }
      };
      collect(nav);
      return paths;
    } catch (err) {
      log.error({ err, siteId, locale }, 'Failed to fetch page list');
      return [];
    }
  }

  /**
   * Walk up the content path to find the nearest page ancestor.
   * content.corporate.en.about.jcr_content.hero → content.corporate.en.about
   */
  private findParentPagePath(path: string): string | null {
    const segments = path.split('.');
    // Page paths are typically: content.{site}.{locale}.{pageName}
    // Child components add more segments: content.{site}.{locale}.{pageName}.jcr_content.{component}
    // Strip everything after and including "jcr_content"
    const jcrIdx = segments.indexOf('jcr_content');
    if (jcrIdx > 0) {
      return segments.slice(0, jcrIdx).join('.');
    }
    // If no jcr_content marker, assume 4-segment paths are pages
    if (segments.length >= 4) {
      return segments.slice(0, 4).join('.');
    }
    return null;
  }

  private looksLikePage(path: string): boolean {
    // Heuristic: page paths don't contain "jcr_content" and have 4+ segments
    return !path.includes('jcr_content') && path.split('.').length >= 4;
  }
}

