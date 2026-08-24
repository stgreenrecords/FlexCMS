/**
 * Browser console, network and media health (REB-25 scenarios 5 and 6).
 *
 * The point of these checks is to catch runtime failures the DOM does not show — a
 * component that threw during render still leaves a page that "loads". They earned
 * their place twice in this program: `/components` rendered an empty document with a
 * `TypeError` in the console and nothing else to see, and the editor canvas once broke
 * every property input through a React render loop that was only visible as console
 * noise.
 *
 * The ignore list is the delicate part. Filtering too eagerly is how a suite stops
 * finding defects, so every entry here names a specific, understood, non-app failure
 * and nothing is matched by a broad pattern.
 */
import type { WebDriver } from 'selenium-webdriver';

/**
 * Console messages that are not app failures.
 *
 * Each entry must be specific enough that a real defect cannot hide behind it.
 */
export const CONSOLE_IGNORE: Array<{ match: RegExp; because: string }> = [
  {
    match: /\/favicon\.ico.*404/i,
    because: 'the admin app ships no favicon; a missing icon is not an app failure',
  },
  {
    match: /Download the React DevTools/i,
    because: 'React development advisory, not an error',
  },
  {
    match: /\[Fast Refresh\]/i,
    because: 'Next.js dev-server noise; absent from production builds',
  },
];

export interface ConsoleFinding {
  level: string;
  message: string;
}

/**
 * Severe console entries, minus the understood exclusions.
 *
 * Chrome only exposes logs it collected since the last read, so this drains the buffer:
 * call it after the interaction being judged.
 */
export async function severeConsoleErrors(driver: WebDriver): Promise<ConsoleFinding[]> {
  let entries: Array<{ level: { name: string }; message: string }> = [];
  try {
    entries = (await driver.manage().logs().get('browser')) as unknown as Array<{
      level: { name: string };
      message: string;
    }>;
  } catch {
    // Not every driver exposes the browser log; absence is not a failure.
    return [];
  }

  return entries
    .filter((entry) => entry.level?.name === 'SEVERE')
    .map((entry) => ({ level: entry.level.name, message: String(entry.message) }))
    .filter((finding) => !CONSOLE_IGNORE.some((rule) => rule.match.test(finding.message)));
}

export interface MediaFinding {
  kind: 'image' | 'video' | 'font';
  src: string;
  detail: string;
}

/**
 * Media the browser failed to load.
 *
 * Read from the browser rather than by re-fetching each URL: `naturalWidth === 0` on a
 * complete image is the browser's own verdict, which also covers cases a separate HTTP
 * request would pass (wrong content type, decode failure, a blocked request).
 */
export async function brokenMedia(driver: WebDriver): Promise<MediaFinding[]> {
  return driver.executeScript<MediaFinding[]>(`
    const findings = [];

    for (const img of document.querySelectorAll('img')) {
      const src = img.currentSrc || img.src || '';
      if (!src) continue;
      // A lazy image below the fold has not been asked to load yet, and is not broken.
      if (!img.complete) continue;
      if (img.naturalWidth === 0) {
        findings.push({ kind: 'image', src, detail: 'complete but zero natural width' });
      }
    }

    for (const video of document.querySelectorAll('video')) {
      const src = video.currentSrc || video.src || '';
      if (!src) continue;
      // networkState 3 is NETWORK_NO_SOURCE: nothing playable was found.
      if (video.networkState === 3) {
        findings.push({ kind: 'video', src, detail: 'no supported source' });
      }
    }

    if (document.fonts && document.fonts.status === 'loaded') {
      for (const face of document.fonts) {
        if (face.status === 'error') {
          findings.push({ kind: 'font', src: face.family, detail: 'font face failed to load' });
        }
      }
    }

    return findings;
  `);
}

/**
 * Resource requests the browser reports as failed, via the Performance timeline.
 *
 * A cross-origin entry can legitimately report `transferSize: 0` from cache, so only
 * same-origin entries are judged — the aim is to catch an app asset that 404s, not to
 * audit third parties.
 */
export async function failedRequests(driver: WebDriver): Promise<string[]> {
  return driver.executeScript<string[]>(`
    const origin = location.origin;
    return performance.getEntriesByType('resource')
      .filter(e => e.name.startsWith(origin))
      .filter(e => e.responseStatus ? e.responseStatus >= 400 : false)
      .map(e => e.name + ' -> HTTP ' + e.responseStatus);
  `);
}

/** Formats findings for an assertion message. */
export function describeFindings(
  console: ConsoleFinding[],
  media: MediaFinding[],
  requests: string[],
): string {
  const lines: string[] = [];
  for (const c of console) lines.push(`  console: ${c.message.slice(0, 200)}`);
  for (const m of media) lines.push(`  ${m.kind}: ${m.src} (${m.detail})`);
  for (const r of requests) lines.push(`  request: ${r}`);
  return lines.join('\n');
}
