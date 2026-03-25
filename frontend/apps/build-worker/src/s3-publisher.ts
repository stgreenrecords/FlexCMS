/**
 * S3Publisher — Uploads compiled static HTML + assets to S3.
 *
 * S3 bucket structure:
 *   sites/{siteId}/{locale}/{pagePath}/index.html
 *   sites/{siteId}/_assets/{hash}.js
 *   _meta/{siteId}/manifest.json
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import type { RenderResult } from './page-renderer';
import type { BuildWorkerConfig } from './index';
import { createLogger } from './logger';

const log = createLogger('s3-publisher');

export interface PublishResult {
  pagePath: string;
  s3Key: string;
  publicUrl: string;
  hash: string;
  contentVersion: string;
}

export class S3Publisher {
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
      forcePathStyle: true, // Required for MinIO
    });
    this.bucket = config.s3Bucket;
  }

  /**
   * Upload a batch of rendered pages to S3.
   */
  async publishBatch(results: RenderResult[], siteId: string, locale: string): Promise<PublishResult[]> {
    const published: PublishResult[] = [];

    for (const result of results) {
      try {
        const pub = await this.publishPage(result, siteId, locale);
        published.push(pub);
      } catch (err) {
        log.error({ err, pagePath: result.pagePath }, 'Failed to upload to S3');
      }
    }

    return published;
  }

  /**
   * Upload a single rendered page to S3.
   */
  private async publishPage(result: RenderResult, siteId: string, locale: string): Promise<PublishResult> {
    // Convert content path to URL-style path for S3 key
    // content.corporate.en.about → sites/corporate/en/about/index.html
    const urlPath = this.contentPathToUrlPath(result.pagePath, siteId, locale);
    const s3Key = `sites/${siteId}/${locale}/${urlPath}/index.html`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: result.html,
        ContentType: 'text/html; charset=utf-8',
        CacheControl: 'public, max-age=0, s-maxage=31536000, must-revalidate',
        Metadata: {
          'flexcms-hash': result.hash,
          'flexcms-version': result.contentVersion,
          'flexcms-path': result.pagePath,
        },
      })
    );

    log.debug({ s3Key, hash: result.hash }, 'Uploaded to S3');

    return {
      pagePath: result.pagePath,
      s3Key,
      publicUrl: `/${urlPath}`,
      hash: result.hash,
      contentVersion: result.contentVersion,
    };
  }

  /**
   * Delete a batch of pages from S3 (for DEACTIVATE / DELETE events).
   * Returns the number of objects successfully deleted.
   */
  async deleteBatch(pagePaths: string[], siteId: string, locale: string): Promise<number> {
    if (pagePaths.length === 0) return 0;

    const keys = pagePaths.map((path) => {
      const urlPath = this.contentPathToUrlPath(path, siteId, locale);
      return { Key: `sites/${siteId}/${locale}/${urlPath}/index.html` };
    });

    // S3 supports deleting up to 1000 objects per request
    let deleted = 0;
    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      try {
        await this.s3.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: batch, Quiet: true },
          })
        );
        deleted += batch.length;
        log.debug({ count: batch.length }, 'Deleted objects from S3');
      } catch (err) {
        log.error({ err, count: batch.length }, 'Failed to delete objects from S3');
      }
    }
    return deleted;
  }

  /**
   * Convert a content tree path to a URL path for S3 storage.
   * content.corporate.en.about → about
   * content.corporate.en.products.widget-x → products/widget-x
   * content.corporate.en → (empty = homepage)
   */
  private contentPathToUrlPath(contentPath: string, siteId: string, locale: string): string {
    const prefix = `content.${siteId}.${locale}.`;
    if (contentPath.startsWith(prefix)) {
      const remainder = contentPath.substring(prefix.length);
      return remainder.length > 0 ? remainder.replace(/\./g, '/') : '';
    }
    // Fallback: strip first 3 segments
    const segments = contentPath.split('.');
    if (segments.length > 3) {
      return segments.slice(3).join('/');
    }
    return '';
  }
}

