import { PubSub, Topic } from '@google-cloud/pubsub';
import type { ClassifiedLog, PubSubMessage } from '../../types';
import { pubsubConfig } from '../../config/pubsub.config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { logError } from '../../utils/ErrorLogger';

export class Publisher {
  private topic: Topic;
  private messageBuffer: PubSubMessage[] = [];
  private flushTimer: Timer | null = null;

  constructor(private pubsub: PubSub, topicName: string) {
    this.topic = pubsub.topic(topicName, {
      batching: pubsubConfig.batching,
    });
  }

  async publish(log: ClassifiedLog): Promise<string> {
    const message: PubSubMessage = {
      id: uuidv4(),
      log,
      publishedAt: new Date(),
      attributes: {
        severity: log.severity,
        containerId: log.containerId,
        containerName: log.containerName,
      },
    };

    try {
      const messageId = await this.topic.publishMessage({
        json: message,
        attributes: message.attributes,
      });

      logger.debug(`Published message ${message.id} to PubSub (messageId: ${messageId})`);
      return messageId;
    } catch (error) {
      logError('Failed to publish message:', error);
      throw error;
    }
  }

  async publishBatch(logs: ClassifiedLog[]): Promise<string[]> {
    const publishPromises = logs.map(log => this.publish(log));
    
    try {
      const messageIds = await Promise.allSettled(publishPromises);
      
      const successful = messageIds.filter(
        result => result.status === 'fulfilled'
      ).length;
      
      logger.info(`Published batch: ${successful}/${logs.length} messages succeeded`);
      
      return messageIds
        .filter((result): result is PromiseFulfilledResult<string> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    } catch (error) {
      logError('Failed to publish batch:', error);
      throw error;
    }
  }

  // Buffer messages and flush periodically for better performance
  bufferAndPublish(log: ClassifiedLog): void {
    const message: PubSubMessage = {
      id: uuidv4(),
      log,
      publishedAt: new Date(),
      attributes: {
        severity: log.severity,
        containerId: log.containerId,
        containerName: log.containerName,
      },
    };

    this.messageBuffer.push(message);

    // Auto-flush if buffer is full
    if (this.messageBuffer.length >= pubsubConfig.batching.maxMessages) {
      this.flush();
    } else if (!this.flushTimer) {
      // Set timer for periodic flush
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, pubsubConfig.batching.maxMilliseconds);
    }
  }

  private async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.messageBuffer.length === 0) {
      return;
    }

    const toPublish = [...this.messageBuffer];
    this.messageBuffer = [];

    try {
      const promises = toPublish.map(msg =>
        this.topic.publishMessage({
          json: msg,
          attributes: msg.attributes,
        })
      );

      await Promise.all(promises);
      logger.debug(`Flushed ${toPublish.length} buffered messages`);
    } catch (error) {
      logError('Failed to flush buffer:', error);
      // Re-add failed messages to buffer
      this.messageBuffer.unshift(...toPublish);
    }
  }

  async close(): Promise<void> {
    // Flush remaining messages
    await this.flush();
    logger.info('Publisher closed');
  }
}