import { PubSub, Topic } from '@google-cloud/pubsub';
import type { ClassifiedLog, PubSubMessage } from '../../types';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { logError } from '../../utils/ErrorLogger';

function sanitizeAttributes(
  attrs: Record<string, unknown>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attrs)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );
}

export class PubSubService {
  private pubsub: PubSub;
  private topic!: Topic;

  constructor() {
    this.pubsub = new PubSub({
      projectId: config.pubsub.projectId,
    });
  }

  async initialize(): Promise<void> {
    this.topic = this.pubsub.topic(config.pubsub.topicName);
    logger.info(`PubSub ready for topic: ${config.pubsub.topicName}`);
  }

  async publish(log: ClassifiedLog): Promise<string> {
    const message: PubSubMessage = {
      id: uuidv4(),
      log,
      publishedAt: new Date().toISOString(),
      attributes: {
        severity: String(log.severity),
        containerId: String(log.containerId),
        containerName: String(log.containerName),
      },
    };

    const attributes = sanitizeAttributes(message.attributes);

    const payloadBytes = Buffer.byteLength(
      JSON.stringify(message),
      'utf8'
    );

    // Pub/Sub hard limit is 10MB
    if (payloadBytes > 9_000_000) {
      logError('PubSub message too large, skipping', {
        bytes: payloadBytes,
        containerId: log.containerId,
      });
      return 'skipped-too-large';
    }

    try {
      const messageId = await this.topic.publishMessage({
        json: message,
        attributes,
      });

      logger.debug(`Published log ${message.id} to PubSub (${messageId})`);
      return messageId;
    } catch (error) {
      logError('Failed to publish log to PubSub', {
        error,
        topic: this.topic.name,
        payloadBytes,
        attributes,
      });
      throw error;
    }
  }

  async publishBatch(logs: ClassifiedLog[]): Promise<string[]> {
    const results: string[] = [];

    for (const log of logs) {
      try {
        const id = await this.publish(log);
        results.push(id);
      } catch {
        // error already logged
      }
    }

    return results;
  }

  async publishHealthCheck(): Promise<void> {
    const payload = {
      type: 'health-check',
      timestamp: new Date().toISOString(),
    };

    await this.topic.publishMessage({
      json: payload,
      attributes: {
        source: 'service-health',
      },
    });
  }

  async close(): Promise<void> {
    // Only call this during app shutdown
    await this.pubsub.close();
    logger.info('PubSub connection closed');
  }
}