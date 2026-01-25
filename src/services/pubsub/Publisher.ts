import { PubSub, Topic } from '@google-cloud/pubsub';
import type { ClassifiedLog, PubSubMessage } from '../../types';
import { pubsubConfig } from '../../config/pubsub.config';
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

export class Publisher {
  private topic: Topic;
  private buffer: PubSubMessage[] = [];
  private flushTimer: Timer | null = null;

  constructor(pubsub: PubSub, topicName: string) {
    this.topic = pubsub.topic(topicName, {
      batching: pubsubConfig.batching,
    });
  }

  async publish(log: ClassifiedLog): Promise<string> {
    const message: PubSubMessage = {
      id: uuidv4(),
      log,
      publishedAt: new Date().toISOString(),
    };

    const attributes = sanitizeAttributes(attributes);

    const payloadBytes = Buffer.byteLength(
      JSON.stringify(message),
      'utf8'
    );

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

      logger.debug(`Published message ${message.id} (${messageId})`);
      return messageId;
    } catch (error) {
      logError('Failed to publish message', {
        error,
        payloadBytes,
        attributes,
      });
      throw error;
    }
  }

  bufferAndPublish(log: ClassifiedLog): void {
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

    this.buffer.push(message);

    if (this.buffer.length >= pubsubConfig.batching.maxMessages) {
      void this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(
        () => void this.flush(),
        pubsubConfig.batching.maxMilliseconds
      );
    }
  }

  private async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    try {
      await Promise.all(
        batch.map(msg =>
          this.topic.publishMessage({
            json: msg,
            attributes: sanitizeAttributes(msg.attributes),
          })
        )
      );

      logger.debug(`Flushed ${batch.length} buffered messages`);
    } catch (error) {
      logError('Failed to flush PubSub buffer', error);
      this.buffer.unshift(...batch);
    }
  }

  async close(): Promise<void> {
    await this.flush();
    logger.info('Publisher closed');
  }
}