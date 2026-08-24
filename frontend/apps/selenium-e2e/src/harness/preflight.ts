/**
 * Environment preflight (REB-25 scenario 1).
 *
 * Mutation suites are expensive and their failures are hard to read when the real
 * cause is a service that was never running. This checks every endpoint the suites
 * depend on and fails with a diagnostic that names the endpoint, the URL, and the
 * environment variable that points at it — so "the suite is broken" and "the publish
 * instance is down" never look the same again.
 *
 * The check is deliberately shallow: reachability, not correctness. A suite asserting
 * product behaviour is the right place to discover that an endpoint answers wrongly;
 * this is only here to say whether it answers at all.
 */
import { loadEnv, type SeleniumEnv } from '../driver/env';

export interface EndpointCheck {
  /** Human name used in diagnostics. */
  name: string;
  url: string;
  /** The environment variable that overrides this URL. */
  envVar: string;
  /** Status codes that prove the service is up. */
  acceptable: number[];
  /** Whether a suite can run without it. */
  required: boolean;
}

export interface EndpointResult extends EndpointCheck {
  status: number | null;
  reachable: boolean;
  error?: string;
}

/**
 * The endpoints every admin suite depends on.
 *
 * `acceptable` is a list rather than a single 200 because "reachable" and "returns 200"
 * are different questions: the admin root redirects, and an authenticated API answering
 * 401 has still proved it is listening.
 */
export function endpointChecks(env: SeleniumEnv = loadEnv()): EndpointCheck[] {
  return [
    {
      name: 'admin app',
      url: `${env.adminUrl}/dashboard`,
      envVar: 'ADMIN_URL',
      acceptable: [200],
      required: true,
    },
    {
      name: 'author API',
      url: `${env.authorApiUrl}/admin/sites`,
      envVar: 'AUTHOR_API_URL',
      acceptable: [200, 401, 403],
      required: true,
    },
    {
      name: 'author health',
      url: env.authorHealthUrl,
      envVar: 'AUTHOR_HEALTH_URL',
      acceptable: [200],
      required: true,
    },
    {
      name: 'publish API',
      url: `${env.publishUrl}/actuator/health`,
      envVar: 'PUBLISH_URL',
      acceptable: [200],
      required: true,
    },
    {
      name: 'public site',
      url: env.siteUrl,
      envVar: 'SITE_URL',
      acceptable: [200, 302, 307],
      required: true,
    },
  ];
}

async function check(endpoint: EndpointCheck, timeoutMs: number): Promise<EndpointResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint.url, { signal: controller.signal, redirect: 'manual' });
    return {
      ...endpoint,
      status: res.status,
      reachable: endpoint.acceptable.includes(res.status),
    };
  } catch (error) {
    return {
      ...endpoint,
      status: null,
      reachable: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Checks every endpoint, in parallel, without throwing. */
export async function inspectEnvironment(
  env: SeleniumEnv = loadEnv(),
  timeoutMs = 10_000,
): Promise<EndpointResult[]> {
  return Promise.all(endpointChecks(env).map((endpoint) => check(endpoint, timeoutMs)));
}

/** Renders results as a table for a failure message or an artifact note. */
export function describeEnvironment(results: EndpointResult[]): string {
  return results
    .map((r) => {
      const state = r.reachable ? 'OK  ' : 'DOWN';
      const detail = r.error ? ` (${r.error})` : ` (HTTP ${r.status})`;
      return `  ${state} ${r.name.padEnd(14)} ${r.url}${r.reachable ? '' : detail}`;
    })
    .join('\n');
}

/**
 * Fails the run when a required endpoint is unreachable.
 *
 * The message names what to start and which variable redirects it, because the most
 * common cause is a service that was not started rather than a misconfiguration.
 */
export async function assertEnvironmentReady(env: SeleniumEnv = loadEnv()): Promise<EndpointResult[]> {
  const results = await inspectEnvironment(env);
  const missing = results.filter((r) => r.required && !r.reachable);

  if (missing.length > 0) {
    throw new Error(
      `Environment preflight failed — ${missing.length} required endpoint(s) unreachable.\n`
        + `${describeEnvironment(results)}\n\n`
        + `Unreachable: ${missing.map((m) => `${m.name} (override with ${m.envVar})`).join(', ')}.\n`
        + 'This is an environment blocker, not a product defect: start the missing service and '
        + 'rerun. Nothing in the suite was executed.',
    );
  }

  return results;
}
