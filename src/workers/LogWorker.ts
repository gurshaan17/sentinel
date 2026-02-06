import { Subscriber } from '../services/pubsub/Subscriber';
import { PubSub } from '@google-cloud/pubsub';
import { AdvisoryPipeline } from '../pipelines/AdvisoryPipeline';
import type { PubSubMessage } from '../types';
import { logger } from '../utils/logger';

export class LogWorker {
  private subscriber: Subscriber;
  private pipeline: AdvisoryPipeline;

  constructor(
    private pubsub: PubSub,
    subscriptionName: string
  ) {
    this.pipeline = new AdvisoryPipeline();
    this.subscriber = new Subscriber(
      pubsub,
      subscriptionName,
      this.handleMessage.bind(this)
    );
  }

  async start(): Promise<void> {
    logger.info('Starting LogWorker...');
    await this.subscriber.start();
    logger.info('LogWorker started');
  }

  async stop(): Promise<void> {
    logger.info('Stopping LogWorker...');
    await this.subscriber.stop();
    logger.info('LogWorker stopped');
  }

  private async handleMessage(message: PubSubMessage): Promise<void> {
    logger.debug(`Processing log message ${message.id}`);
    
    try {
      // Process through advisory pipeline
      await this.pipeline.process([message.log]);
      
      logger.debug(`Successfully processed message ${message.id}`);
    } catch (error) {
      logger.error({ error, messageId: message.id }, 
        'Failed to process message');
      throw error; // Will cause nack
    }
  }
}