/**
 * ManifestManager — Maintains the build manifest in S3.
 *
 * The manifest tracks which pages have been compiled, their content versions,
 * and hashes. Used for incremental builds (skip pages whose version hasn't changed)
 * and for CDN origin routing.
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { PublishResult } from './s3-publisher';
import type { BuildWorkerConfig } from './index';
import { createLogger } from './logger';

const log = createLogger('manifest-manager');

export interface BuildManifest {
  siteId: string;
  locale: string;
  builtAt: string;
  pages: Record<string, ManifestPage>;
}

export interface ManifestPage {
  hash: string;
  builtAt: string;
  contentVersion: string;
  s3Key: string;
}

export class ManifestManager {
  private s3: S3Client;
  private bucket: string;

  constructor(private config: BuildWorkerConfig) {
    this.s3 = new S3Client({
      endpoint: config.s3Endpoint,
      region: config.s3Region,
      credentials: {
        accessKeyId: config.s3AccessKey,
        secretAccessKey: config.s3SecretKey,
      },
      forcePathStyle: true,
    });
    this.bucket = config.s3Bucket;
  }

  /**
   * Load the current manifest for a site/locale.
   */
  async load(siteId: string, locale: string): Promise<BuildManifest> {
    const key = this.manifestKey(siteId, locale);
    try {
      const response = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );
      const body = await response.Body?.transformToString();
      if (body) return JSON.parse(body);
    } catch {
      // Manifest doesn't exist yet
    }

    return { siteId, locale, builtAt: new Date().toISOString(), pages: {} };
  }

  /**
   * Update the manifest with newly built pages.
   */
  async update(siteId: string, locale: string, results: PublishResult[]): Promise<void> {
    const manifest = await this.load(siteId, locale);
    const now = new Date().toISOString();

    for (const result of results) {
      manifest.pages[result.pagePath] = {
        hash: result.hash,
        builtAt: now,
        contentVersion: result.contentVersion,
        s3Key: result.s3Key,
      };
    }

    manifest.builtAt = now;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.manifestKey(siteId, locale),
        Body: JSON.stringify(manifest, null, 2),
        ContentType: 'application/json',
      })
    );

    log.info({ siteId, locale, pages: results.length }, 'Manifest updated');
  }

  /**
   * Remove pages from the manifest (for DEACTIVATE / DELETE events).
   */
  async remove(siteId: string, locale: string, pagePaths: string[]): Promise<void> {
    const manifest = await this.load(siteId, locale);
    let changed = false;
    for (const path of pagePaths) {
      if (manifest.pages[path]) {
        delete manifest.pages[path];
        changed = true;
      }
    }
    if (!changed) return;
    manifest.builtAt = new Date().toISOString();
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.manifestKey(siteId, locale),
        Body: JSON.stringify(manifest, null, 2),
        ContentType: 'application/json',
      })
    );
    log.info({ siteId, locale, removed: pagePaths.length }, 'Manifest entries removed');
  }

  /**
   * Check if a page needs recompilation by comparing content versions.
   */
  async isStale(siteId: string, locale: string, pagePath: string, currentVersion: string): Promise<boolean> {
    const manifest = await this.load(siteId, locale);
    const existing = manifest.pages[pagePath];
    if (!existing) return true; // Never built
    return existing.contentVersion !== currentVersion;
  }

  private manifestKey(siteId: string, locale: string): string {
    return `_meta/${siteId}/${locale}/manifest.json`;
  }
}

