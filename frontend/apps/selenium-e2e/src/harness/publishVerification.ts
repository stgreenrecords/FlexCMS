/**
 * Publish-environment verification (REB-25 scenario 2, AC2).
 *
 * A publish assertion is only worth anything if it actually talked to the publish
 * instance. The failure mode this guards against is quiet and total: point a "publish"
 * check at the author URL and it passes for every page, because the author instance
 * serves content whether or not it was ever published. The suite then proves nothing
 * while looking green.
 *
 * So the base URL is validated at construction, not at the call site:
 *
 *  * it must be configured;
 *  * it must not be the author API or the author health host — the mix-up this exists
 *    to prevent;
 *  * every request is built from that one base, and callers cannot pass their own.
 */
import { loadEnv, type SeleniumEnv } from '../driver/env';

export interface PublishPageResult {
  status: number;
  /** Response body, when the request succeeded. */
  body: unknown;
  /** The URL actually requested, for evidence. */
  url: string;
}

/** Host of a URL, or the raw string when it will not parse. */
function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export class PublishVerifier {
  private readonly base: string;

  constructor(private readonly env: SeleniumEnv = loadEnv()) {
    const base = (env.publishUrl ?? '').replace(/\/+$/, '');

    if (!base) {
      throw new Error(
        'PublishVerifier: no publish URL is configured. Set PUBLISH_URL — a publish '
          + 'assertion with no publish instance to talk to cannot verify anything.',
      );
    }

    // The guard that gives this class its reason to exist.
    const authorHosts = [hostOf(env.authorApiUrl), hostOf(env.authorHealthUrl)];
    if (authorHosts.includes(hostOf(base))) {
      throw new Error(
        `PublishVerifier: the publish URL (${base}) resolves to the same host as the author `
          + `API (${authorHosts.join(', ')}). Verifying "publish" against the author instance `
          + 'passes for content that was never published, so the check would be worthless. '
          + 'Point PUBLISH_URL at the publish instance.',
      );
    }

    this.base = base;
  }

  /** The publish base every request is built from, for evidence in reports. */
  get baseUrl(): string {
    return this.base;
  }

  private async request(path: string): Promise<PublishPageResult> {
    const url = `${this.base}${path.startsWith('/') ? path : `/${path}`}`;
    const res = await fetch(url);
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { status: res.status, body, url };
  }

  /** Whether the publish instance is answering at all. */
  async isHealthy(): Promise<boolean> {
    try {
      const { status } = await this.request('/actuator/health');
      return status === 200;
    } catch {
      return false;
    }
  }

  /** Content path in the slash form the headless routes expect. */
  private static toSlashPath(path: string): string {
    return path.replace(/^content\./, '').replace(/\./g, '/').replace(/^\/+/, '');
  }

  /** A page as the publish instance serves it. */
  async getPage(pathOrLtree: string): Promise<PublishPageResult> {
    return this.request(`/api/content/v1/pages/${PublishVerifier.toSlashPath(pathOrLtree)}`);
  }

  /** A node as the publish instance serves it. */
  async getNode(pathOrLtree: string): Promise<PublishPageResult> {
    return this.request(`/api/content/v1/nodes/${PublishVerifier.toSlashPath(pathOrLtree)}`);
  }

  /** An experience-fragment variation as the publish instance serves it. */
  async getXfVariation(xfPath: string, variationType = 'master'): Promise<PublishPageResult> {
    return this.request(
      `/api/content/v1/xf/variation/${variationType}?path=${encodeURIComponent(xfPath)}`,
    );
  }

  /**
   * Waits for a marker to appear in what publish serves, because replication is
   * asynchronous.
   *
   * Returns the outcome rather than throwing: a scenario that finds the marker missing
   * usually wants to record *what* publish served, not just that it timed out.
   */
  async waitForMarker(
    pathOrLtree: string,
    marker: string,
    { attempts = 20, intervalMs = 1000 } = {},
  ): Promise<{ found: boolean; attemptsUsed: number; last: PublishPageResult }> {
    let last: PublishPageResult = { status: 0, body: null, url: '' };

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      last = await this.getPage(pathOrLtree);
      if (last.status === 200 && JSON.stringify(last.body ?? '').includes(marker)) {
        return { found: true, attemptsUsed: attempt, last };
      }
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return { found: false, attemptsUsed: attempts, last };
  }

  /** Whether publish still serves a path — the assertion a deletion needs. */
  async serves(pathOrLtree: string): Promise<boolean> {
    const { status } = await this.getPage(pathOrLtree);
    return status === 200;
  }

  /** Rendered HTML for a public route on the publish instance. */
  async getRendered(urlPath: string): Promise<PublishPageResult> {
    return this.request(urlPath.startsWith('/') ? urlPath : `/${urlPath}`);
  }
}

/** Shared instance for suites that need no special configuration. */
export function publishVerifier(env: SeleniumEnv = loadEnv()): PublishVerifier {
  return new PublishVerifier(env);
}
