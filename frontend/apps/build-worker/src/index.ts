/**
 * @flexcms/build-worker — Static Site Compilation Worker
 *
 * Consumes replication events from RabbitMQ and pre-renders affected pages
 * into static HTML, uploading the output to S3 for CDN serving.
 *
 * Only changed pages are recompiled (incremental builds via manifest staleness check).
 *
 * Event handling:
 *  ACTIVATE   → resolve affected pages → render → upload → update manifest
 *  DEACTIVATE → delete from S3 → remove from manifest
 *  DELETE     → delete from S3 → remove from manifest
 */
import { EventConsumer } from './event-consumer';
import { DependencyResolver } from './dependency-resolver';
import { PageRenderer } from './page-renderer';
import { S3Publisher } from './s3-publisher';
import { ManifestManager } from './manifest-manager';
import { BuildDependencyClient } from './build-dependency-client';
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
  cmsApiUrl:   process.env['FLEXCMS_API_URL']       ?? 'http://localhost:8080',
  amqpUrl:     process.env['AMQP_URL']              ?? 'amqp://guest:guest@localhost:5672',
  s3Endpoint:  process.env['S3_ENDPOINT']           ?? 'http://localhost:9000',
  s3Bucket:    process.env['S3_STATIC_BUCKET']      ?? 'flexcms-static',
  s3AccessKey: process.env['S3_ACCESS_KEY']         ?? 'minioadmin',
  s3SecretKey: process.env['S3_SECRET_KEY']         ?? 'minioadmin',
  s3Region:    process.env['S3_REGION']             ?? 'us-east-1',
  concurrency: parseInt(process.env['BUILD_CONCURRENCY'] ?? '4', 10),
  instanceId:  process.env['INSTANCE_ID']           ?? `build-worker-${Date.now()}`,
};

async function main() {
  const config = defaultConfig;
  log.info({ config: { ...config, s3SecretKey: '***' } }, 'Starting static build worker');

  const publisher = new S3Publisher(config);
  const manifest  = new ManifestManager(config);
  const depClient = new BuildDependencyClient(config);
  // Pass manifest to renderer so it can skip unchanged pages
  const renderer  = new PageRenderer(config, manifest);
  const resolver  = new DependencyResolver(config);

  const consumer = new EventConsumer(config, async (event) => {
    const startTime = Date.now();
    log.info(
      { eventId: event.eventId, action: event.action, type: event.type, path: event.path, site: event.siteId },
      'Processing replication event'
    );

    // ── DEACTIVATE / DELETE ────────────────────────────────────────────────
    // Remove page(s) from S3 and the manifest rather than rebuilding them.
    if (event.action === 'DEACTIVATE' || event.action === 'DELETE') {
      const pathsToRemove = event.affectedPaths?.length
        ? event.affectedPaths
        : [event.path];

      const removed = await publisher.deleteBatch(pathsToRemove, event.siteId, event.locale);
      if (removed > 0) {
        await manifest.remove(event.siteId, event.locale, pathsToRemove);
      }

      // Remove dependency graph entries for deactivated pages so they no longer
      // trigger rebuilds when a shared component or asset changes.
      await Promise.all(
        pathsToRemove.map((p) =>
          depClient.removeDependencies(event.siteId, event.locale, p),
        ),
      );

      log.info(
        { removed, action: event.action, durationMs: Date.now() - startTime },
        'Deactivation complete'
      );
      return;
    }

    // ── ACTIVATE ──────────────────────────────────────────────────────────

    // 1. Resolve which pages need recompilation
    const pagePaths = await resolver.resolve(event);
    if (pagePaths.length === 0) {
      log.info({ path: event.path }, 'No pages affected — skipping');
      return;
    }
    log.info({ count: pagePaths.length, pages: pagePaths.slice(0, 10) }, 'Pages to recompile');

    // 2. Render pages in parallel (bounded concurrency)
    //    Pages whose content version is unchanged will have skipped=true
    const results = await renderer.renderBatch(
      pagePaths,
      event.siteId,
      event.locale,
      config.concurrency
    );

    const rendered = results.filter((r) => !r.skipped);
    const skipped  = results.filter((r) =>  r.skipped);
    log.info({ rendered: rendered.length, skipped: skipped.length }, 'Render batch complete');

    if (rendered.length === 0) {
      log.info({ path: event.path }, 'All pages unchanged — nothing to upload');
      return;
    }

    // 3. Upload changed pages to S3
    const uploaded = await publisher.publishBatch(rendered, event.siteId, event.locale);

    // 4. Update build manifest
    await manifest.update(event.siteId, event.locale, uploaded);

    // 5. Record dependency graph — enables future incremental builds to determine
    //    which pages are affected when an asset or shared component changes.
    //    Runs in parallel for all rendered pages; errors are non-fatal.
    await Promise.all(
      rendered
        .filter((r) => r.dependencies.length > 0)
        .map((r) =>
          depClient.recordDependencies(
            event.siteId, event.locale, r.pagePath, r.dependencies,
          ),
        ),
    );

    // 6. Log changed URLs (CDN invalidation should be triggered here in production)
    const changedUrls = uploaded.map((u) => u.publicUrl);
    log.info(
      {
        pages:      uploaded.length,
        durationMs: Date.now() - startTime,
        urls:       changedUrls.slice(0, 10),
      },
      'Build complete'
    );
  });

  await consumer.start();
  log.info({ instanceId: config.instanceId }, 'Build worker is listening for replication events');

  // ── Readiness probe (simple HTTP ping for Kubernetes/ECS health checks) ──
  const http = await import('node:http');
  const healthServer = http.createServer((_req, res) => {
    if (consumer.isHealthy()) {
      res.writeHead(200).end('OK');
    } else {
      res.writeHead(503).end('Not ready');
    }
  });
  const HEALTH_PORT = parseInt(process.env['HEALTH_PORT'] ?? '9090', 10);
  healthServer.listen(HEALTH_PORT, () => {
    log.info({ port: HEALTH_PORT }, 'Health-check server listening');
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    log.info({ signal }, 'Shutting down gracefully…');
    healthServer.close();
    await consumer.stop();
    log.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  log.error(err, 'Build worker failed to start');
  process.exit(1);
});

