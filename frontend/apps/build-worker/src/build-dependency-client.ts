/**
 * BuildDependencyClient — HTTP client for the FlexCMS build-dependency graph API.
 *
 * Exposes methods to:
 *  - Record the dependency set for a rendered page (POST /api/build/v1/dependencies)
 *  - Query which pages depend on a changed resource (GET /api/build/v1/dependencies/pages)
 *  - Remove stale dependency edges when a page is deactivated/deleted
 *    (DELETE /api/build/v1/dependencies/{siteId}/{locale})
 *
 * All network errors are caught and logged — the build worker continues even
 * if dependency recording fails (it merely means the next asset change event
 * won't be able to narrow the page set from the graph, falling back to
 * broader heuristics in DependencyResolver).
 */
import type { DependencyEntry } from './page-renderer';
import type { BuildWorkerConfig } from './index';
import { createLogger } from './logger';

const log = createLogger('build-dep-client');

export class BuildDependencyClient {
  private readonly apiUrl: string;

  constructor(config: BuildWorkerConfig) {
    // Trim trailing slash so all paths below work correctly
    this.apiUrl = config.cmsApiUrl.replace(/\/$/, '');
  }

  // ── Record ────────────────────────────────────────────────────────────────

  /**
   * Atomically replace the dependency graph for a compiled page.
   *
   * Should be called after every successful render + upload so the graph stays
   * current. Non-fatal: errors are logged but do not interrupt the build.
   */
  async recordDependencies(
    siteId: string,
    locale: string,
    pagePath: string,
    dependencies: DependencyEntry[],
  ): Promise<void> {
    if (dependencies.length === 0) return;

    const url = `${this.apiUrl}/api/build/v1/dependencies`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, locale, pagePath, dependencies }),
      });

      if (!res.ok) {
        log.warn(
          { siteId, locale, pagePath, status: res.status, statusText: res.statusText },
          'Failed to record page dependencies — dependency graph may be stale',
        );
      } else {
        log.debug(
          { pagePath, depCount: dependencies.length },
          'Recorded dependency graph for page',
        );
      }
    } catch (err) {
      log.error({ err, pagePath }, 'Network error recording page dependencies');
    }
  }

  // ── Query ─────────────────────────────────────────────────────────────────

  /**
   * Return all page paths that reference the given DAM asset key.
   *
   * Used by {@link DependencyResolver.resolveAssetChange} to determine which
   * pages must be recompiled when an asset is updated.
   *
   * Returns an empty array on error (safe fallback — the caller can then fall
   * back to a broader rebuild strategy).
   */
  async findPagesForAsset(
    siteId: string,
    locale: string,
    assetKey: string,
  ): Promise<string[]> {
    return this.findPagesByDependency(siteId, locale, 'ASSET', assetKey);
  }

  /**
   * Return all page paths that use the given component resource type.
   *
   * Used when a component definition is updated (schema change, renderer update).
   */
  async findPagesForComponent(
    siteId: string,
    locale: string,
    resourceType: string,
  ): Promise<string[]> {
    return this.findPagesByDependency(siteId, locale, 'COMPONENT', resourceType);
  }

  /**
   * Return all pages that depend on the navigation tree for this site+locale.
   *
   * Used when the content-tree structure changes (add/move/delete page) to
   * rebuild every page that renders a navigation element.
   */
  async findPagesWithNavigationDependency(
    siteId: string,
    locale: string,
  ): Promise<string[]> {
    const url = new URL(`${this.apiUrl}/api/build/v1/dependencies/pages/by-type`);
    url.searchParams.set('siteId', siteId);
    url.searchParams.set('locale', locale);
    url.searchParams.set('type', 'NAVIGATION');

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        log.warn(
          { siteId, locale, status: res.status },
          'Failed to query navigation dependencies — may rebuild more pages than needed',
        );
        return [];
      }
      return (await res.json()) as string[];
    } catch (err) {
      log.error({ err, siteId, locale }, 'Network error querying navigation dependencies');
      return [];
    }
  }

  // ── Remove ────────────────────────────────────────────────────────────────

  /**
   * Remove dependency edges for a deactivated or deleted page.
   *
   * Prevents stale edges from causing spurious rebuilds in future change events.
   * Non-fatal: errors are logged but do not block the deactivation flow.
   */
  async removeDependencies(
    siteId: string,
    locale: string,
    pagePath: string,
  ): Promise<void> {
    const url = new URL(
      `${this.apiUrl}/api/build/v1/dependencies/${encodeURIComponent(siteId)}/${encodeURIComponent(locale)}`,
    );
    url.searchParams.set('pagePath', pagePath);

    try {
      const res = await fetch(url.toString(), { method: 'DELETE' });
      if (!res.ok) {
        log.warn(
          { siteId, locale, pagePath, status: res.status },
          'Failed to remove dependency edges — stale edges may remain',
        );
      } else {
        log.debug({ pagePath }, 'Removed dependency edges for deactivated page');
      }
    } catch (err) {
      log.error({ err, pagePath }, 'Network error removing page dependencies');
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async findPagesByDependency(
    siteId: string,
    locale: string,
    type: string,
    key: string,
  ): Promise<string[]> {
    const url = new URL(`${this.apiUrl}/api/build/v1/dependencies/pages`);
    url.searchParams.set('siteId', siteId);
    url.searchParams.set('locale', locale);
    url.searchParams.set('type', type);
    url.searchParams.set('key', key);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        log.warn(
          { siteId, locale, type, key, status: res.status },
          'Failed to query dependency graph — cannot narrow affected pages',
        );
        return [];
      }
      const pages = (await res.json()) as string[];
      log.debug({ type, key, count: pages.length }, 'Dependency graph returned affected pages');
      return pages;
    } catch (err) {
      log.error({ err, type, key }, 'Network error querying dependency graph');
      return [];
    }
  }
}

