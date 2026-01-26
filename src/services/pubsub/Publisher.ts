import { PubSub, Topic } from '@google-cloud/pubsub';
import type { ClassifiedLog } from '../../types';
import { pubsubConfig } from '../../config/pubsub.config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { logError } from '../../utils/ErrorLogger';

function sanitizeAttributeValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value)
    .normalize('NFKC')
    .replace(/[^\x20-\x7E]/g, '');
}

function sanitizeAttributes(
  attrs: Record<string, unknown>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attrs)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, sanitizeAttributeValue(v)])
  );
}

export class Publisher {
  private topic: Topic;
  private buffer: ClassifiedLog[] = [];
  private flushTimer: Timer | null = null;

  constructor(pubsub: PubSub, topicName: string) {
    // this.topic = pubsub.topic(topicName);
    this.topic = pubsub.topic(topicName, {
      batching: pubsubConfig.batching,
      flowControlOptions: pubsubConfig.flowControl,
    });
  }

  async publish(log: ClassifiedLog): Promise<string> {
    const payload = {
      id: uuidv4(),
      log,
      publishedAt: new Date().toISOString(),
    };

    const attributes = sanitizeAttributes({
      severity: log.severity,
      containerId: log.containerId,
      containerName: log.containerName,
    });

    const payloadBytes = Buffer.byteLength(
      JSON.stringify(payload),
      'utf8'
    );

    if (payloadBytes > 9_000_000) {
      logError('PubSub payload too large, skipping', {
        payloadBytes,
        containerId: log.containerId,
      });
      return 'skipped-too-large';
    }

    try {
      const messageId = await this.topic.publishMessage({
        json: payload,
        attributes,
      });

      logger.debug(`Published message ${payload.id} (${messageId})`);
      return messageId;
    } catch (error: any) {
      // Handle gRPC errors properly
      const errInfo: Record<string, unknown> = {
        message: error?.message || String(error),
        code: error?.code,
        details: error?.details,
        note: error?.note,
      };

      // Extract gRPC error details if available
      if (error?.error) {
        errInfo.grpcError = {
          message: error.error.message,
          code: error.error.code,
          details: error.error.details,
        };
      }

      // Add stack trace if available
      if (error?.stack) {
        errInfo.stack = error.stack;
      }
    
      logError('Failed to publish log to PubSub', {
        error: errInfo,
        topic: this.topic?.name || pubsubConfig.topicName,
        projectId: pubsubConfig.projectId,
        payloadBytes,
        attributes,
      });
      throw error;
    }
    
  }

  bufferAndPublish(log: ClassifiedLog): void {
    this.buffer.push(log);

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
      await Promise.all(batch.map(log => this.publish(log)));
      logger.debug(`Flushed ${batch.length} buffered messages`);
    } catch (error: any) {
      // Log and DROP this batch (or push to a dead-letter store),
      // but don't reinsert into the in-memory buffer, or you'll spin forever.
      logError('Failed to flush PubSub buffer, dropping batch', {
        error: {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          note: error?.note,
        },
      });
      // Optionally: write batch to local file / DLQ instead of discarding.
    }
  }  

  async close(): Promise<void> {
    await this.flush();
    logger.info('Publisher closed');
  }
}
