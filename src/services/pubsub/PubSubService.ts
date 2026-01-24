import { PubSub, Topic } from '@google-cloud/pubsub';
import type { ClassifiedLog, PubSubMessage } from '../../types';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { logError } from '../../utils/ErrorLogger';

export class PubSubService {
  private pubsub: PubSub;
  private topic: Topic | null = null;

  constructor() {
    this.pubsub = new PubSub({
      projectId: config.pubsub.projectId,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Get or create topic
      const [topic] = await this.pubsub.topic(config.pubsub.topicName).get({ autoCreate: true });
      this.topic = topic;
      
      logger.info(`✅ Connected to PubSub topic: ${config.pubsub.topicName}`);
    } catch (error) {
      logError('Failed to initialize PubSub:', error);
      throw error;
    }
  }

  async publish(log: ClassifiedLog): Promise<string> {
    if (!this.topic) {
      throw new Error('PubSub not initialized');
    }

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

      logger.debug(`Published log ${message.id} to PubSub (${messageId})`);
      return messageId;
    } catch (error) {
      logError('Failed to publish to PubSub:', error);
      throw error;
    }
  }

  async publishBatch(logs: ClassifiedLog[]): Promise<string[]> {
    if (!this.topic) {
      throw new Error('PubSub not initialized');
    }

    const promises = logs.map(log => this.publish(log));
    return Promise.all(promises);
  }

  async publishHealthCheck(): Promise<void> {
    if (!this.topic) {
      throw new Error('PubSub not initialized');
    }
  
    await this.topic.publishMessage({
      json: {
        type: 'health-check',
        timestamp: new Date().toISOString(),
      },
      attributes: {
        source: 'service-health',
      },
    });
  }  

  async close(): Promise<void> {
    await this.pubsub.close();
    logger.info('PubSub connection closed');
  }
}