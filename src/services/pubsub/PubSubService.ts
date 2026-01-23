import { PubSub, Topic } from '@google-cloud/pubsub';
import type { ClassifiedLog } from '../../types/log.types';
import type { PubSubMessage } from '../../types/pubsub.types';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class PubSubService {
  private pubsub: PubSub;
  private topic: Topic | null = null;

  constructor() {
    this.pubsub = new PubSub({
      projectId: config.pubsub.projectId,
      keyFilename: config.pubsub.credentialsPath,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Get or create topic
      const [topic] = await this.pubsub.topic(config.pubsub.topicName).get({ autoCreate: true });
      this.topic = topic;
      
      logger.info(`✅ Connected to PubSub topic: ${config.pubsub.topicName}`);
    } catch (error) {
      logger.error('Failed to initialize PubSub:', error);
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
      logger.error('Failed to publish to PubSub:', error);
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

  async close(): Promise<void> {
    await this.pubsub.close();
    logger.info('PubSub connection closed');
  }
}