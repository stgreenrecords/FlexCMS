/**
 * EventConsumer — Connects to RabbitMQ and consumes replication events
 * from a dedicated queue for the static build worker.
 *
 * Features:
 *  - Automatic reconnection with exponential backoff on connection loss
 *  - Dead-letter queue (DLQ) routing for permanently failed messages
 *  - Prefetch for bounded concurrency
 *  - Health-check method for readiness probes
 */
import amqplib, { type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import type { BuildWorkerConfig } from './index';
import { createLogger } from './logger';

const log = createLogger('event-consumer');

export interface ReplicationEvent {
  eventId: string;
  action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE';
  path: string;
  nodeId?: string;
  version?: number;
  siteId: string;
  locale: string;
  type: 'CONTENT' | 'ASSET' | 'TREE';
  affectedPaths?: string[];
  resourceType?: string;
  parentPath?: string;
  timestamp: string;
  initiatedBy: string;
}

export type EventHandler = (event: ReplicationEvent) => Promise<void>;

const EXCHANGE = 'flexcms.replication';
const QUEUE_PREFIX = 'flexcms.static-build';
const DLQ_NAME = 'flexcms.replication.dlq';

/** Maximum number of reconnection attempts before giving up */
const MAX_RECONNECT_ATTEMPTS = 10;
/** Base delay for reconnection backoff (ms) */
const BASE_RECONNECT_DELAY_MS = 1_000;

export class EventConsumer {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private reconnectAttempts = 0;
  private stopping = false;
  private queueName: string;

  constructor(
    private config: BuildWorkerConfig,
    private handler: EventHandler
  ) {
    this.queueName = `${QUEUE_PREFIX}.${this.config.instanceId}`;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async start(): Promise<void> {
    await this.connect();
  }

  async stop(): Promise<void> {
    this.stopping = true;
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // Ignore errors on shutdown
    }
    this.channel = null;
    this.connection = null;
    log.info('Event consumer stopped');
  }

  /** Returns true if the channel is open and ready to consume. */
  isHealthy(): boolean {
    return this.channel !== null && !this.stopping;
  }

  // ---------------------------------------------------------------------------
  // Connection management
  // ---------------------------------------------------------------------------

  private async connect(): Promise<void> {
    while (!this.stopping) {
      try {
        this.connection = await amqplib.connect(this.config.amqpUrl);
        this.channel = await this.connection.createChannel();

        // Register connection-level error handlers for reconnection
        this.connection.on('error', (err) => {
          log.error({ err }, 'RabbitMQ connection error');
        });
        this.connection.on('close', () => {
          if (!this.stopping) {
            log.warn('RabbitMQ connection closed unexpectedly — scheduling reconnect');
            this.channel = null;
            this.connection = null;
            this.scheduleReconnect();
          }
        });

        await this.setupTopology();
        await this.startConsuming();

        this.reconnectAttempts = 0; // Reset on successful connect
        log.info({ queue: this.queueName }, 'Listening for replication events');
        return; // Success — exit the loop
      } catch (err) {
        this.reconnectAttempts++;
        if (this.reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
          log.error({ err }, 'Exceeded maximum reconnect attempts — giving up');
          throw err;
        }
        const delay = Math.min(
          BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1),
          30_000
        );
        log.warn({ attempt: this.reconnectAttempts, delay }, 'Connection failed — retrying');
        await this.sleep(delay);
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.stopping) return;
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      30_000
    );
    log.info({ delay }, 'Scheduling reconnect');
    setTimeout(() => {
      if (!this.stopping) this.connect().catch((err) => log.fatal({ err }, 'Reconnect failed'));
    }, delay);
  }

  // ---------------------------------------------------------------------------
  // AMQP topology setup
  // ---------------------------------------------------------------------------

  private async setupTopology(): Promise<void> {
    const ch = this.channel!;

    // Ensure the main exchange exists
    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });

    // Ensure the dead-letter queue exists (for permanently failed messages)
    await ch.assertQueue(DLQ_NAME, { durable: true });

    // Create a durable queue for this build-worker instance
    await ch.assertQueue(this.queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': DLQ_NAME,
        'x-message-ttl': 86_400_000, // 24 h — purge if build-worker is down for too long
      },
    });

    // Bind to all content, asset, and tree replication events
    await ch.bindQueue(this.queueName, EXCHANGE, 'content.replicate.#');
    await ch.bindQueue(this.queueName, EXCHANGE, 'asset.replicate.#');
    await ch.bindQueue(this.queueName, EXCHANGE, 'tree.replicate.#');

    // Prefetch = 1 ensures ordered processing per message (bounded concurrency
    // is handled at the renderer level, not the AMQP level)
    await ch.prefetch(1);
  }

  // ---------------------------------------------------------------------------
  // Message consumption
  // ---------------------------------------------------------------------------

  private async startConsuming(): Promise<void> {
    await this.channel!.consume(this.queueName, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      let event: ReplicationEvent | undefined;
      try {
        event = JSON.parse(msg.content.toString()) as ReplicationEvent;
        log.debug(
          { eventId: event.eventId, type: event.type, action: event.action, path: event.path },
          'Received replication event'
        );

        await this.handler(event);
        this.channel!.ack(msg);
      } catch (err) {
        const isPermanentError = this.isPermanentError(err);
        log.error(
          { err, eventId: event?.eventId, permanent: isPermanentError },
          'Failed to process event'
        );

        if (isPermanentError) {
          // Route to DLQ — do not retry
          this.channel!.nack(msg, false, false);
        } else {
          // Transient error — re-queue for retry
          this.channel!.nack(msg, false, true);
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Classify an error as permanent (malformed message, unknown event type, etc.)
   * vs transient (network timeout, API unavailable).
   */
  private isPermanentError(err: unknown): boolean {
    if (err instanceof SyntaxError) return true; // Malformed JSON
    if (err instanceof TypeError) return true;   // Programming error
    if (err instanceof Error) {
      // HTTP 4xx from the CMS API = permanent (bad reference)
      if (err.message.includes('404') || err.message.includes('400')) return true;
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
