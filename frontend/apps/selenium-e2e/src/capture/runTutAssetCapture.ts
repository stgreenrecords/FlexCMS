import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';
import { URL } from 'node:url';
import type { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../driver/browser';
import { scrollThroughPage, sleep, waitForFontsReady, waitForNetworkIdle, waitForPageReady } from '../driver/waits';

type PageKind = 'templates' | 'components';
type AssetCategory = 'image' | 'font' | 'stylesheet' | 'media' | 'script' | 'other';
type ResourceStatus = 'downloaded' | 'disallowed' | 'missing' | 'error';

interface PageDefinition {
  kind: PageKind;
  slug: string;
  sourceDir: string;
  sourceHtmlPath: string;
  sourceScreenshotPath?: string;
  outputDir: string;
  servedPath: string;
}

interface BrowserCandidate {
  url: string;
  hint: string;
  source: string;
}

interface BrowserResourceEntry {
  url: string;
  initiatorType: string;
  transferSize?: number;
  decodedBodySize?: number;
  duration?: number;
}

interface BrowserObservation {
  title: string;
  domCandidates: BrowserCandidate[];
  resourceEntries: BrowserResourceEntry[];
}

interface ResourceCandidate {
  url: string;
  discoveryHints: string[];
  sources: string[];
}

interface CapturedAsset {
  sourceUrl: string;
  finalUrl: string;
  category: AssetCategory;
  status: ResourceStatus;
  discoveryHints: string[];
  sources: string[];
  contentType: string | null;
  localPath: string | null;
  byteSize: number | null;
  sha256: string | null;
  provenanceNote: string;
  notes: string | null;
}

interface PageManifest {
  kind: PageKind;
  slug: string;
  title: string;
  sourceHtml: string;
  sourceScreenshot: string | null;
  normalizedHtml: string;
  screenshotEvidence: string;
  manifestPath: string;
  status: 'captured' | 'captured_with_blockers';
  resourceSummary: Record<string, number>;
  resources: CapturedAsset[];
  blockers: CapturedAsset[];
}

interface GlobalManifest {
  generatedAt: string;
  runner: string;
  pages: Array<{
    kind: PageKind;
    slug: string;
    status: PageManifest['status'];
    manifestPath: string;
    normalizedHtml: string;
    screenshotEvidence: string;
    blockerCount: number;
    resourceSummary: Record<string, number>;
  }>;
  skippedFolders: Array<{ kind: PageKind; slug: string; reason: string }>;
  totals: Record<string, number>;
}

interface StaticServer {
  baseUrl: string;
  close(): Promise<void>;
}

const packageRoot = path.resolve(__dirname, '../../..');
const repoRoot = path.resolve(packageRoot, '../../..');
const sourceRoot = path.join(repoRoot, 'Design', 'sample-website-tut');
const templateSourceRoot = path.join(sourceRoot, 'template-libs');
const componentSourceRoot = path.join(sourceRoot, 'component-libs');
const outputRoot = path.join(repoRoot, 'Design', 'tut-usa');
const templatesOutputRoot = path.join(outputRoot, 'templates');
const componentsOutputRoot = path.join(outputRoot, 'components');
const assetsRoot = path.join(outputRoot, 'assets');
const imageAssetsRoot = path.join(assetsRoot, 'images');
const fontAssetsRoot = path.join(assetsRoot, 'fonts');
const mediaAssetsRoot = path.join(assetsRoot, 'media');
const styleAssetsRoot = path.join(assetsRoot, 'styles');
const capturePort = parseInt(process.env['CAPTURE_PORT'] ?? '4173', 10);
const captureStartedAt = new Date().toISOString();
const chromeLikeUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const allowedCategories = new Set<AssetCategory>(['image', 'font', 'stylesheet', 'media']);

const browserObservationScript = String.raw`
  return (() => {
    const results = [];
    const resourceEntries = performance.getEntriesByType('resource').map((entry) => ({
      url: entry.name,
      initiatorType: entry.initiatorType || 'other',
      transferSize: Number(entry.transferSize || 0),
      decodedBodySize: Number(entry.decodedBodySize || 0),
      duration: Number(entry.duration || 0),
    }));

    const push = (value, hint, source) => {
      if (!value || typeof value !== 'string') return;
      const trimmed = value.trim();
      if (!/^https?:\/\//i.test(trimmed)) return;
      results.push({ url: trimmed, hint, source });
    };

    const extractCssUrls = (value, source) => {
      if (!value) return;
      const regex = /url\((['"]?)([^'"\)]+)\1\)/g;
      let match;
      while ((match = regex.exec(value)) !== null) {
        const resolved = match[2] ? new URL(match[2], document.baseURI).href : '';
        push(resolved, 'style', source);
      }
    };

    document.querySelectorAll('img').forEach((element) => {
      push(element.currentSrc || element.src, 'image', 'img[src]');
      const srcset = element.getAttribute('srcset');
      if (srcset) {
        srcset.split(',').map((part) => part.trim().split(/\s+/)[0]).forEach((url) => {
          if (url) push(new URL(url, document.baseURI).href, 'image', 'img[srcset]');
        });
      }
    });

    document.querySelectorAll('source').forEach((element) => {
      const src = element.getAttribute('src');
      if (src) push(new URL(src, document.baseURI).href, 'media', 'source[src]');
      const srcset = element.getAttribute('srcset');
      if (srcset) {
        srcset.split(',').map((part) => part.trim().split(/\s+/)[0]).forEach((url) => {
          if (url) push(new URL(url, document.baseURI).href, 'image', 'source[srcset]');
        });
      }
    });

    document.querySelectorAll('script[src]').forEach((element) => push(element.src, 'script', 'script[src]'));
    document.querySelectorAll('link[href]').forEach((element) => {
      const rel = (element.getAttribute('rel') || '').toLowerCase();
      const asValue = (element.getAttribute('as') || '').toLowerCase();
      let hint = 'link';
      if (rel.includes('stylesheet')) hint = 'stylesheet';
      else if (asValue === 'font' || rel.includes('preload')) hint = 'font';
      push(element.href, hint, 'link[rel=' + (rel || 'n/a') + ']');
    });

    document.querySelectorAll('video[src], audio[src]').forEach((element) => {
      const src = element.getAttribute('src');
      if (src) push(new URL(src, document.baseURI).href, 'media', element.tagName.toLowerCase() + '[src]');
    });

    document.querySelectorAll('[poster]').forEach((element) => {
      const poster = element.getAttribute('poster');
      if (poster) push(new URL(poster, document.baseURI).href, 'image', element.tagName.toLowerCase() + '[poster]');
    });

    document.querySelectorAll('[style]').forEach((element) => extractCssUrls(element.getAttribute('style'), 'inline-style'));
    document.querySelectorAll('style').forEach((element) => extractCssUrls(element.textContent || '', 'style-tag'));

    return {
      title: document.title,
      domCandidates: results,
      resourceEntries,
    };
  })();
`;

class AssetStore {
  private readonly cache = new Map<string, CapturedAsset>();

  async captureCandidate(candidate: ResourceCandidate, pageAssets: Map<string, CapturedAsset>): Promise<CapturedAsset> {
    return this.captureUrl(candidate.url, candidate.discoveryHints, candidate.sources, pageAssets, new Set<string>());
  }

  private async captureUrl(
    url: string,
    discoveryHints: string[],
    sources: string[],
    pageAssets: Map<string, CapturedAsset>,
    recursionTrail: Set<string>,
  ): Promise<CapturedAsset> {
    const cached = this.cache.get(url);
    if (cached) {
      pageAssets.set(url, mergeAssetMetadata(cached, discoveryHints, sources));
      return cached;
    }

    const initialCategory = inferCategory(url, discoveryHints, null);
    if (!allowedCategories.has(initialCategory)) {
      const disallowed = finalizeAsset({
        sourceUrl: url,
        finalUrl: url,
        category: initialCategory,
        status: 'disallowed',
        discoveryHints,
        sources,
        contentType: null,
        localPath: null,
        byteSize: null,
        sha256: null,
        provenanceNote: `Provenance-only reference from ${safeHost(url)}; ${initialCategory} resources are not downloaded in REB-02 when they are not static assets.`,
        notes: initialCategory === 'script'
          ? 'Remote script left as blocker/provenance evidence; normalized output does not vendor third-party runtime scripts.'
          : 'URL classified as non-static or unsupported for local capture.',
      });
      this.remember(url, disallowed, pageAssets);
      return disallowed;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': chromeLikeUserAgent,
          accept: '*/*',
        },
      });
    } catch (error) {
      const failed = finalizeAsset({
        sourceUrl: url,
        finalUrl: url,
        category: initialCategory,
        status: 'error',
        discoveryHints,
        sources,
        contentType: null,
        localPath: null,
        byteSize: null,
        sha256: null,
        provenanceNote: `Download error from ${safeHost(url)}.`,
        notes: error instanceof Error ? error.message : String(error),
      });
      this.remember(url, failed, pageAssets);
      return failed;
    }

    const finalUrl = response.url || url;
    const contentType = response.headers.get('content-type')?.split(';')[0].trim() ?? null;
    const mergedHints = uniqueValues(discoveryHints.concat(guessHintFromContentType(contentType)));
    const category = inferCategory(finalUrl, mergedHints, contentType);

    if (!response.ok) {
      const missing = finalizeAsset({
        sourceUrl: url,
        finalUrl,
        category,
        status: 'missing',
        discoveryHints: mergedHints,
        sources,
        contentType,
        localPath: null,
        byteSize: null,
        sha256: null,
        provenanceNote: `Remote host ${safeHost(finalUrl)} responded with HTTP ${response.status}.`,
        notes: `HTTP ${response.status} ${response.statusText}`,
      });
      this.remember(url, missing, pageAssets, finalUrl);
      return missing;
    }

    if (!allowedCategories.has(category)) {
      const disallowed = finalizeAsset({
        sourceUrl: url,
        finalUrl,
        category,
        status: 'disallowed',
        discoveryHints: mergedHints,
        sources,
        contentType,
        localPath: null,
        byteSize: null,
        sha256: null,
        provenanceNote: `Downloaded headers from ${safeHost(finalUrl)} classified this resource as ${category}; it is retained as provenance-only evidence.`,
        notes: 'Resource content type is outside the permitted static-asset categories for REB-02.',
      });
      this.remember(url, disallowed, pageAssets, finalUrl);
      return disallowed;
    }

    const arrayBuffer = await response.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    const sha256 = crypto.createHash('sha256').update(originalBuffer).digest('hex');
    const localPath = buildLocalAssetPath(finalUrl, category, contentType, sha256);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });

    let persistedBuffer = originalBuffer;
    if (category === 'stylesheet') {
      const nestedTrail = new Set(recursionTrail);
      nestedTrail.add(url);
      const cssText = originalBuffer.toString('utf8');
      const rewrittenCss = await this.rewriteStylesheet(cssText, finalUrl, localPath, pageAssets, nestedTrail);
      persistedBuffer = Buffer.from(rewrittenCss, 'utf8');
    }

    fs.writeFileSync(localPath, persistedBuffer);
    const downloaded = finalizeAsset({
      sourceUrl: url,
      finalUrl,
      category,
      status: 'downloaded',
      discoveryHints: mergedHints,
      sources,
      contentType,
      localPath: toRepoRelative(localPath),
      byteSize: persistedBuffer.length,
      sha256,
      provenanceNote: `Captured from ${safeHost(finalUrl)}; license/provenance requires human review if redistribution policy is unclear.`,
      notes: null,
    });
    this.remember(url, downloaded, pageAssets, finalUrl);
    return downloaded;
  }

  private async rewriteStylesheet(
    cssText: string,
    stylesheetUrl: string,
    stylesheetLocalPath: string,
    pageAssets: Map<string, CapturedAsset>,
    recursionTrail: Set<string>,
  ): Promise<string> {
    const discovered = extractCssRemoteReferences(cssText, stylesheetUrl);
    let rewritten = cssText;

    for (const reference of discovered) {
      if (recursionTrail.has(reference.absoluteUrl)) {
        continue;
      }

      const nestedHints = reference.kind === 'import'
        ? ['stylesheet', 'css-import']
        : ['style', 'css-url'];
      const nestedSources = [`stylesheet:${toRepoRelative(stylesheetLocalPath)}`];
      const asset = await this.captureUrl(reference.absoluteUrl, nestedHints, nestedSources, pageAssets, new Set(recursionTrail));

      if (asset.status === 'downloaded' && asset.localPath) {
        const replacement = toPosix(path.relative(path.dirname(stylesheetLocalPath), path.join(repoRoot, asset.localPath)));
        rewritten = rewritten.split(reference.rawReference).join(replacement);
      }
    }

    return rewritten;
  }

  private remember(url: string, asset: CapturedAsset, pageAssets: Map<string, CapturedAsset>, finalUrl?: string): void {
    this.cache.set(url, asset);
    this.cache.set(asset.finalUrl, asset);
    if (finalUrl) {
      this.cache.set(finalUrl, asset);
    }
    pageAssets.set(url, asset);
    pageAssets.set(asset.finalUrl, asset);
    if (finalUrl) {
      pageAssets.set(finalUrl, asset);
    }
  }
}

async function main(): Promise<void> {
  ensureOutputFolders();

  const skippedFolders = discoverSkippedFolders();
  const pages = discoverPages();
  if (pages.length === 0) {
    throw new Error('No TUT template/component code.html files were found for REB-02 capture.');
  }

  const server = await startStaticServer(sourceRoot, capturePort);
  const driver = await createDriver();
  const assetStore = new AssetStore();
  const pageManifests: PageManifest[] = [];

  try {
    for (const page of pages) {
      const manifest = await capturePage(driver, server.baseUrl, page, assetStore);
      pageManifests.push(manifest);
      console.log(`[REB-02] ${page.kind}/${page.slug}: ${manifest.status} (${manifest.resources.length} resources, ${manifest.blockers.length} blockers)`);
    }
  } finally {
    await quitDriver(driver);
    await server.close();
  }

  const globalManifest = buildGlobalManifest(pageManifests, skippedFolders);
  const globalManifestPath = path.join(outputRoot, 'manifest.json');
  fs.writeFileSync(globalManifestPath, JSON.stringify(globalManifest, null, 2) + '\n', 'utf8');

  const totals = globalManifest.totals;
  console.log(`[REB-02] Completed ${pageManifests.length} capture pages with ${totals.downloaded} downloaded assets, ${totals.blockers} blockers, ${totals.missing} missing resources, and ${totals.disallowed} disallowed references.`);
}

async function capturePage(driver: WebDriver, baseUrl: string, page: PageDefinition, assetStore: AssetStore): Promise<PageManifest> {
  fs.mkdirSync(page.outputDir, { recursive: true });
  const pageUrl = `${baseUrl}/${page.servedPath}`;

  await driver.get(pageUrl);
  await waitForPageReady(driver, 30_000);
  await waitForFontsReady(driver, 30_000);
  await waitForNetworkIdle(driver, { timeoutMs: 30_000, idleMs: 1_200 });
  await scrollThroughPage(driver, 200);
  await waitForNetworkIdle(driver, { timeoutMs: 30_000, idleMs: 1_200 });
  await sleep(300);

  const screenshotPath = path.join(page.outputDir, 'capture-evidence.png');
  await writeScreenshot(driver, screenshotPath);

  const observation = await driver.executeScript<BrowserObservation>(browserObservationScript);
  const title = observation.title || page.slug;
  const candidates = mergeCandidates(observation, baseUrl);
  const pageAssets = new Map<string, CapturedAsset>();

  for (const candidate of candidates) {
    await assetStore.captureCandidate(candidate, pageAssets);
  }

  const sourceHtml = fs.readFileSync(page.sourceHtmlPath, 'utf8');
  const normalizedHtml = rewriteHtml(sourceHtml, page.outputDir, pageAssets);
  const normalizedHtmlPath = path.join(page.outputDir, 'normalized.html');
  fs.writeFileSync(normalizedHtmlPath, normalizedHtml, 'utf8');

  if (page.sourceScreenshotPath && fs.existsSync(page.sourceScreenshotPath)) {
    fs.copyFileSync(page.sourceScreenshotPath, path.join(page.outputDir, 'screenshot-reference.png'));
  }

  const resources = dedupeAssets(Array.from(pageAssets.values()));
  const blockers = resources.filter((asset) => asset.status !== 'downloaded');
  const summary = summarizeResources(resources);
  const status: PageManifest['status'] = blockers.length > 0 ? 'captured_with_blockers' : 'captured';
  const manifestPath = path.join(page.outputDir, 'assets-manifest.json');

  const manifest: PageManifest = {
    kind: page.kind,
    slug: page.slug,
    title,
    sourceHtml: toRepoRelative(page.sourceHtmlPath),
    sourceScreenshot: page.sourceScreenshotPath ? toRepoRelative(page.sourceScreenshotPath) : null,
    normalizedHtml: toRepoRelative(normalizedHtmlPath),
    screenshotEvidence: toRepoRelative(screenshotPath),
    manifestPath: toRepoRelative(manifestPath),
    status,
    resourceSummary: summary,
    resources,
    blockers,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  writeSourceReference(page, manifest);
  return manifest;
}

function buildGlobalManifest(pageManifests: PageManifest[], skippedFolders: GlobalManifest['skippedFolders']): GlobalManifest {
  const totals = {
    pages: pageManifests.length,
    downloaded: 0,
    disallowed: 0,
    missing: 0,
    error: 0,
    blockers: 0,
  };

  for (const manifest of pageManifests) {
    totals.downloaded += manifest.resourceSummary.downloaded ?? 0;
    totals.disallowed += manifest.resourceSummary.disallowed ?? 0;
    totals.missing += manifest.resourceSummary.missing ?? 0;
    totals.error += manifest.resourceSummary.error ?? 0;
    totals.blockers += manifest.blockers.length;
  }

  return {
    generatedAt: captureStartedAt,
    runner: 'frontend/apps/selenium-e2e/src/capture/runTutAssetCapture.ts',
    pages: pageManifests.map((manifest) => ({
      kind: manifest.kind,
      slug: manifest.slug,
      status: manifest.status,
      manifestPath: manifest.manifestPath,
      normalizedHtml: manifest.normalizedHtml,
      screenshotEvidence: manifest.screenshotEvidence,
      blockerCount: manifest.blockers.length,
      resourceSummary: manifest.resourceSummary,
    })),
    skippedFolders,
    totals,
  };
}

function discoverPages(): PageDefinition[] {
  return [
    ...discoverPagesForKind('templates', templateSourceRoot, templatesOutputRoot, 'template-libs'),
    ...discoverPagesForKind('components', componentSourceRoot, componentsOutputRoot, 'component-libs'),
  ];
}

function discoverPagesForKind(kind: PageKind, sourceDir: string, outputDir: string, servedBase: string): PageDefinition[] {
  if (!fs.existsSync(sourceDir)) {
    return [];
  }

  const pages: PageDefinition[] = [];

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const htmlPath = path.join(sourceDir, entry.name, 'code.html');
    if (!fs.existsSync(htmlPath)) {
      continue;
    }

    const screenshotPath = path.join(sourceDir, entry.name, 'screen.png');
    pages.push({
      kind,
      slug: entry.name,
      sourceDir: path.join(sourceDir, entry.name),
      sourceHtmlPath: htmlPath,
      sourceScreenshotPath: fs.existsSync(screenshotPath) ? screenshotPath : undefined,
      outputDir: path.join(outputDir, entry.name),
      servedPath: `${servedBase}/${entry.name}/code.html`,
    });
  }

  return pages;
}

function discoverSkippedFolders(): GlobalManifest['skippedFolders'] {
  return [
    ...discoverSkippedFoldersForKind('templates', templateSourceRoot),
    ...discoverSkippedFoldersForKind('components', componentSourceRoot),
  ];
}

function discoverSkippedFoldersForKind(kind: PageKind, sourceDir: string): GlobalManifest['skippedFolders'] {
  if (!fs.existsSync(sourceDir)) {
    return [];
  }

  return fs.readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !fs.existsSync(path.join(sourceDir, entry.name, 'code.html')))
    .map((entry) => ({
      kind,
      slug: entry.name,
      reason: 'No code.html present in source folder; skipped by capture runner.',
    }));
}

async function startStaticServer(rootDir: string, port: number): Promise<StaticServer> {
  const server = http.createServer((request, response) => {
    const requestUrl = request.url ?? '/';
    const parsed = new URL(requestUrl, `http://127.0.0.1:${port}`);
    const relativePath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    const filePath = path.normalize(path.join(rootDir, relativePath));

    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, { 'content-type': guessLocalContentType(filePath) });
    fs.createReadStream(filePath).pipe(response);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve());
  });

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

function mergeCandidates(observation: BrowserObservation, baseUrl: string): ResourceCandidate[] {
  const candidates = new Map<string, ResourceCandidate>();

  const remember = (url: string, hint: string, source: string) => {
    if (!/^https?:\/\//i.test(url)) return;
    if (url.startsWith(baseUrl)) return;
    const existing = candidates.get(url);
    if (existing) {
      existing.discoveryHints = uniqueValues(existing.discoveryHints.concat(hint));
      existing.sources = uniqueValues(existing.sources.concat(source));
      return;
    }
    candidates.set(url, {
      url,
      discoveryHints: uniqueValues([hint]),
      sources: uniqueValues([source]),
    });
  };

  for (const candidate of observation.domCandidates) {
    remember(candidate.url, candidate.hint, candidate.source);
  }

  for (const resource of observation.resourceEntries) {
    remember(resource.url, resource.initiatorType || 'performance', 'performance');
  }

  return Array.from(candidates.values()).sort((left, right) => left.url.localeCompare(right.url));
}

function rewriteHtml(sourceHtml: string, pageOutputDir: string, pageAssets: Map<string, CapturedAsset>): string {
  let rewritten = sourceHtml;
  const downloadableAssets = dedupeAssets(Array.from(pageAssets.values()))
    .filter((asset) => asset.status === 'downloaded' && asset.localPath)
    .sort((left, right) => right.sourceUrl.length - left.sourceUrl.length);

  for (const asset of downloadableAssets) {
    const absoluteLocalPath = path.join(repoRoot, asset.localPath!);
    const replacement = toPosix(path.relative(pageOutputDir, absoluteLocalPath));
    rewritten = replaceEverywhere(rewritten, asset.sourceUrl, replacement);
    rewritten = replaceEverywhere(rewritten, asset.finalUrl, replacement);
    rewritten = replaceEverywhere(rewritten, encodeHtmlAmpersands(asset.sourceUrl), replacement);
    rewritten = replaceEverywhere(rewritten, encodeHtmlAmpersands(asset.finalUrl), replacement);
  }

  return `<!-- Generated by REB-02 Selenium capture runner at ${captureStartedAt}. See assets-manifest.json for blockers/provenance. -->\n${rewritten}`;
}

function writeSourceReference(page: PageDefinition, manifest: PageManifest): void {
  const filePath = path.join(page.outputDir, 'source-ref.md');
  const singularKind = page.kind === 'templates' ? 'template' : 'component-group';
  const lines = [
    `# ${page.slug}`,
    '',
    `- Kind: \`${singularKind}\``,
    `- Source HTML: \`${manifest.sourceHtml}\``,
    `- Source screenshot: ${manifest.sourceScreenshot ? `\`${manifest.sourceScreenshot}\`` : 'not available in source'}`,
    `- Normalized HTML: \`${manifest.normalizedHtml}\``,
    `- Capture screenshot: \`${manifest.screenshotEvidence}\``,
    `- Manifest: \`${manifest.manifestPath}\``,
    `- Status: \`${manifest.status}\``,
    `- Blockers: ${manifest.blockers.length}`,
    '',
    '## Notes',
    '',
    '- Source input was served read-only from `Design/sample-website-tut/` through the local Selenium capture server.',
    '- Downloaded assets were rewritten to local relative paths when the resource category was permitted (`image`, `font`, `stylesheet`, `media`).',
    '- Disallowed or unavailable resources remain documented in `assets-manifest.json` as blockers/provenance evidence.',
    '',
  ];
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

function summarizeResources(resources: CapturedAsset[]): Record<string, number> {
  return resources.reduce<Record<string, number>>((accumulator, resource) => {
    accumulator[resource.status] = (accumulator[resource.status] ?? 0) + 1;
    accumulator[resource.category] = (accumulator[resource.category] ?? 0) + 1;
    return accumulator;
  }, {});
}

function dedupeAssets(resources: CapturedAsset[]): CapturedAsset[] {
  const seen = new Map<string, CapturedAsset>();
  for (const resource of resources) {
    const existing = seen.get(resource.finalUrl);
    if (!existing) {
      seen.set(resource.finalUrl, resource);
      continue;
    }
    seen.set(resource.finalUrl, mergeAssetMetadata(existing, resource.discoveryHints, resource.sources));
  }
  return Array.from(seen.values()).sort((left, right) => left.finalUrl.localeCompare(right.finalUrl));
}

function replaceEverywhere(value: string, target: string, replacement: string): string {
  return target ? value.split(target).join(replacement) : value;
}

function extractCssRemoteReferences(cssText: string, baseUrl: string): Array<{ absoluteUrl: string; rawReference: string; kind: 'url' | 'import' }> {
  const discovered: Array<{ absoluteUrl: string; rawReference: string; kind: 'url' | 'import' }> = [];
  const push = (rawReference: string, kind: 'url' | 'import') => {
    if (!rawReference || rawReference.startsWith('data:') || rawReference.startsWith('blob:')) {
      return;
    }
    const absoluteUrl = new URL(rawReference, baseUrl).href;
    if (!/^https?:\/\//i.test(absoluteUrl)) {
      return;
    }
    discovered.push({ absoluteUrl, rawReference, kind });
  };

  const urlRegex = /url\((['"]?)([^'")]+)\1\)/g;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(cssText)) !== null) {
    push(match[2], 'url');
  }

  const importRegex = /@import\s+(?:url\()?['"]?([^'")\s]+)['"]?\)?/g;
  while ((match = importRegex.exec(cssText)) !== null) {
    push(match[1], 'import');
  }

  return discovered;
}

function inferCategory(url: string, discoveryHints: string[], contentType: string | null): AssetCategory {
  const lowerHints = discoveryHints.map((hint) => hint.toLowerCase());
  const pathname = safePathname(url).toLowerCase();
  const extension = path.posix.extname(pathname);

  if (contentType?.includes('javascript') || lowerHints.includes('script') || extension === '.js' || extension === '.mjs') {
    return 'script';
  }
  if (contentType?.startsWith('text/css') || lowerHints.includes('stylesheet') || extension === '.css') {
    return 'stylesheet';
  }
  if (contentType?.startsWith('image/') || lowerHints.includes('image') || ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'].includes(extension)) {
    return 'image';
  }
  if (contentType?.startsWith('font/') || lowerHints.includes('font') || ['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(extension) || url.includes('fonts.gstatic.com')) {
    return 'font';
  }
  if (contentType?.startsWith('video/') || contentType?.startsWith('audio/') || lowerHints.includes('media') || ['.mp4', '.webm', '.ogg', '.mp3', '.wav'].includes(extension)) {
    return 'media';
  }
  return 'other';
}

function guessHintFromContentType(contentType: string | null): string[] {
  if (!contentType) return [];
  if (contentType.startsWith('text/css')) return ['stylesheet'];
  if (contentType.startsWith('image/')) return ['image'];
  if (contentType.startsWith('font/')) return ['font'];
  if (contentType.startsWith('video/') || contentType.startsWith('audio/')) return ['media'];
  if (contentType.includes('javascript')) return ['script'];
  return [];
}

function buildLocalAssetPath(sourceUrl: string, category: AssetCategory, contentType: string | null, sha256: string): string {
  const assetRoot = category === 'image'
    ? imageAssetsRoot
    : category === 'font'
      ? fontAssetsRoot
      : category === 'media'
        ? mediaAssetsRoot
        : styleAssetsRoot;
  const parsed = new URL(sourceUrl);
  const rawBaseName = truncateSlug(
    slugify(path.posix.basename(parsed.pathname, path.posix.extname(parsed.pathname)) || parsed.hostname || category),
    48,
  );
  const extension = inferExtension(parsed, contentType, category);
  return path.join(assetRoot, `${sha256.slice(0, 16)}-${rawBaseName || category}${extension}`);
}

function inferExtension(parsedUrl: URL, contentType: string | null, category: AssetCategory): string {
  const pathnameExtension = path.posix.extname(parsedUrl.pathname).toLowerCase();
  if (pathnameExtension && pathnameExtension.length <= 10) {
    return pathnameExtension;
  }

  const byType: Record<string, string> = {
    'text/css': '.css',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/gif': '.gif',
    'font/woff2': '.woff2',
    'font/woff': '.woff',
    'font/ttf': '.ttf',
    'font/otf': '.otf',
    'video/mp4': '.mp4',
    'audio/mpeg': '.mp3',
  };

  if (contentType && byType[contentType]) {
    return byType[contentType];
  }

  switch (category) {
    case 'stylesheet': return '.css';
    case 'font': return '.woff2';
    case 'media': return '.bin';
    case 'image': return '.img';
    default: return '.bin';
  }
}

function ensureOutputFolders(): void {
  [
    templatesOutputRoot,
    componentsOutputRoot,
    imageAssetsRoot,
    fontAssetsRoot,
    mediaAssetsRoot,
    styleAssetsRoot,
  ].forEach((directory) => fs.mkdirSync(directory, { recursive: true }));
}

function guessLocalContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  const mapping: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
  };
  return mapping[extension] ?? 'application/octet-stream';
}

function toRepoRelative(filePath: string): string {
  return toPosix(path.relative(repoRoot, filePath));
}

function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}

function safePathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'unknown-host';
  }
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();
}

function truncateSlug(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength).replace(/-+$/g, '');
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function encodeHtmlAmpersands(value: string): string {
  return value.replace(/&/g, '&amp;');
}

function mergeAssetMetadata(asset: CapturedAsset, discoveryHints: string[], sources: string[]): CapturedAsset {
  return {
    ...asset,
    discoveryHints: uniqueValues(asset.discoveryHints.concat(discoveryHints)),
    sources: uniqueValues(asset.sources.concat(sources)),
  };
}

function finalizeAsset(asset: CapturedAsset): CapturedAsset {
  return {
    ...asset,
    discoveryHints: uniqueValues(asset.discoveryHints),
    sources: uniqueValues(asset.sources),
  };
}

async function writeScreenshot(driver: WebDriver, targetPath: string): Promise<void> {
  const base64 = await driver.takeScreenshot();
  fs.writeFileSync(targetPath, base64, 'base64');
}

void main().catch((error) => {
  console.error('[REB-02] Capture failed:', error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});

