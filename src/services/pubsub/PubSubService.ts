import { PubSub, Topic } from '@google-cloud/pubsub';
import type { ClassifiedLog } from '../../types';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { logError } from '../../utils/ErrorLogger';

/**
 * Normalize + sanitize Pub/Sub attribute values
 * - forces string
 * - normalizes unicode
 * - strips non-printable / non-ASCII chars
 */
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

export class PubSubService {
  private pubsub: PubSub;
  private topic!: Topic;

  constructor() {
    this.pubsub = new PubSub({
      projectId: config.pubsub.projectId,
      //@ts-ignore
      fallback: true,
    });
    
  }

  async initialize(): Promise<void> {
    if (!config.pubsub.projectId) {
      throw new Error('GCP_PROJECT_ID is required but not set');
    }
    if (!config.pubsub.topicName) {
      throw new Error('PUBSUB_TOPIC_NAME is required but not set');
    }
    
    this.topic = this.pubsub.topic(config.pubsub.topicName);
    const topicPath = `projects/${config.pubsub.projectId}/topics/${config.pubsub.topicName}`;
    logger.info(`PubSub initialized - Project: ${config.pubsub.projectId}, Topic: ${config.pubsub.topicName} (${topicPath})`);
  }

  async publish(log: ClassifiedLog): Promise<string> {
    if (!this.topic) {
      throw new Error('PubSub topic not initialized. Call initialize() first.');
    }

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

    // Pub/Sub hard limit: 10MB
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

      logger.debug(`Published log ${payload.id} (${messageId})`);
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
        topic: this.topic?.name || config.pubsub.topicName,
        projectId: config.pubsub.projectId,
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
    if (!this.topic) {
      throw new Error('PubSub topic not initialized. Call initialize() first.');
    }
    
    try {
      await this.topic.publishMessage({
        json: {
          type: 'health-check',
          timestamp: new Date().toISOString(),
        },
        attributes: {
          source: 'service-health',
        },
      });
    } catch (error: any) {
      // Handle gRPC errors properly for health check
      const errInfo: Record<string, unknown> = {
        message: error?.message || String(error),
        code: error?.code,
        details: error?.details,
        note: error?.note,
      };

      if (error?.error) {
        errInfo.grpcError = {
          message: error.error.message,
          code: error.error.code,
          details: error.error.details,
        };
      }

      if (error?.stack) {
        errInfo.stack = error.stack;
      }

      logError('Failed to publish health check to PubSub', {
        error: errInfo,
        topic: this.topic?.name || config.pubsub.topicName,
        projectId: config.pubsub.projectId,
      });
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pubsub.close();
    logger.info('PubSub connection closed');
  }
}
