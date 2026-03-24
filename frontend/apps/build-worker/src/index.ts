/**
 * @flexcms/build-worker — Static Site Compilation Worker
 *
 * Consumes replication events from RabbitMQ and pre-renders affected pages
 * into static HTML + JS + CSS, uploading the output to S3 for CDN serving.
 *
 * Only changed pages are recompiled (incremental builds via dependency graph).
 */

import { EventConsumer } from './event-consumer';
import { DependencyResolver } from './dependency-resolver';
import { PageRenderer } from './page-renderer';
import { S3Publisher } from './s3-publisher';
import { ManifestManager } from './manifest-manager';
import { createLogger } from './logger';

const log = createLogger('build-worker');

export interface BuildWorkerConfig {
  /** FlexCMS API base URL */
  cmsApiUrl: string;
  /** RabbitMQ connection URL */
  amqpUrl: string;
  /** S3 endpoint for static output */
  s3Endpoint: string;
  s3Bucket: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3Region: string;
  /** Max concurrent page renders */
  concurrency: number;
  /** Worker instance ID */
  instanceId: string;
}

const defaultConfig: BuildWorkerConfig = {
  cmsApiUrl: process.env.FLEXCMS_API_URL ?? 'http://localhost:8080',
  amqpUrl: process.env.AMQP_URL ?? 'amqp://guest:guest@localhost:5672',
  s3Endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  s3Bucket: process.env.S3_STATIC_BUCKET ?? 'flexcms-static',
  s3AccessKey: process.env.S3_ACCESS_KEY ?? 'minioadmin',
  s3SecretKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
  s3Region: process.env.S3_REGION ?? 'us-east-1',
  concurrency: parseInt(process.env.BUILD_CONCURRENCY ?? '4', 10),
  instanceId: process.env.INSTANCE_ID ?? `build-worker-${Date.now()}`,
};

async function main() {
  const config = defaultConfig;
  log.info({ config: { ...config, s3SecretKey: '***' } }, 'Starting static build worker');

  const publisher = new S3Publisher(config);
  const manifest = new ManifestManager(config);
  const renderer = new PageRenderer(config);
  const resolver = new DependencyResolver(config);

  const consumer = new EventConsumer(config, async (event) => {
    const startTime = Date.now();
    log.info({ event: event.type, path: event.path, site: event.siteId }, 'Processing replication event');

    // 1. Resolve which pages need recompilation
    const pagePaths = await resolver.resolve(event);
    if (pagePaths.length === 0) {
      log.info({ path: event.path }, 'No pages affected, skipping');
      return;
    }
    log.info({ count: pagePaths.length, pages: pagePaths.slice(0, 10) }, 'Pages to recompile');

    // 2. Render pages in parallel (bounded concurrency)
    const results = await renderer.renderBatch(pagePaths, event.siteId, event.locale, config.concurrency);

    // 3. Upload to S3
    const uploaded = await publisher.publishBatch(results, event.siteId, event.locale);

    // 4. Update manifest
    await manifest.update(event.siteId, event.locale, uploaded);

    // 5. Trigger CDN invalidation for changed URLs
    const changedUrls = uploaded.map((u) => u.publicUrl);
    log.info(
      {
        pages: uploaded.length,
        durationMs: Date.now() - startTime,
        urls: changedUrls.slice(0, 5),
      },
      'Build complete'
    );
  });

  await consumer.start();
  log.info('Build worker is listening for replication events');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    log.info('Shutting down...');
    await consumer.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  log.error(err, 'Build worker failed to start');
  process.exit(1);
});

