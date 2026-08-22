/**
 * FlexCMS Selenium E2E — imported site asset lookup (REB-19).
 *
 * The asset round-trip scenario must reference an asset that really exists in
 * the public asset pipeline REB-07 produced, otherwise a "broken image" result
 * would only prove the test picked a bad URL. Assets are read from the site
 * app's public root and returned as site-absolute URLs.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveRepoRoot } from './component-contracts';

const SITE_PUBLIC_RELATIVE = path.join('frontend', 'apps', 'site-nextjs', 'public');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']);

let cachedImageUrls: string[] | undefined;

function walk(dir: string, acc: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      acc.push(full);
    }
  }
}

/**
 * Site-absolute URLs (e.g. `/tut-usa/assets/images/abc.png`) for every image in
 * the reference site's public root, sorted so a suite's pick is deterministic.
 */
export function importedSiteImageUrls(): string[] {
  if (!cachedImageUrls) {
    const publicRoot = path.join(resolveRepoRoot(), SITE_PUBLIC_RELATIVE);
    if (!fs.existsSync(publicRoot)) {
      throw new Error(`Site public root not found at ${publicRoot}; run the REB-07 asset import first.`);
    }
    const files: string[] = [];
    walk(publicRoot, files);
    cachedImageUrls = files
      .map((file) => `/${path.relative(publicRoot, file).split(path.sep).join('/')}`)
      .sort();
  }
  return cachedImageUrls;
}

/** A deterministic imported image URL, used as the authored asset reference. */
export function firstImportedSiteImageUrl(): string {
  const urls = importedSiteImageUrls();
  if (urls.length === 0) {
    throw new Error('No imported site images were found; the REB-07 asset pipeline has not run.');
  }
  return urls[0];
}
