/**
 * EventConsumer — Connects to RabbitMQ and consumes replication events
 * from a dedicated queue for the static build worker.
 */
import amqplib, { type Channel, type Connection } from 'amqplib';
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

export class EventConsumer {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  constructor(
    private config: BuildWorkerConfig,
    private handler: EventHandler
  ) {}

  async start(): Promise<void> {
    this.connection = await amqplib.connect(this.config.amqpUrl);
    this.channel = await this.connection.createChannel();

    const queueName = `${QUEUE_PREFIX}.${this.config.instanceId}`;

    // Ensure exchange exists
    await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    // Create a durable queue for this build worker
    await this.channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': 'flexcms.replication.dlq',
      },
    });

    // Bind to all content and asset replication events
    await this.channel.bindQueue(queueName, EXCHANGE, 'content.replicate.#');
    await this.channel.bindQueue(queueName, EXCHANGE, 'asset.replicate.#');

    // Set prefetch for bounded concurrency
    await this.channel.prefetch(1);

    // Start consuming
    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const event: ReplicationEvent = JSON.parse(msg.content.toString());
        log.debug({ eventId: event.eventId, type: event.type }, 'Received event');

        await this.handler(event);
        this.channel!.ack(msg);
      } catch (err) {
        log.error({ err, messageId: msg.properties.messageId }, 'Failed to process event');
        // Negative-acknowledge — message goes to DLQ
        this.channel!.nack(msg, false, false);
      }
    });

    log.info({ queue: queueName }, 'Listening for replication events');
  }

  async stop(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}

