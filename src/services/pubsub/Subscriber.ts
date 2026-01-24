import { PubSub, Subscription, Message } from '@google-cloud/pubsub';
import type { PubSubMessage } from '../../types';
import { pubsubConfig } from '../../config/pubsub.config';
import { logger } from '../../utils/logger';
import { logError } from '../../utils/ErrorLogger';

export type MessageHandler = (message: PubSubMessage) => Promise<void> | void;

export class Subscriber {
  private subscription: Subscription;
  private isListening = false;

  constructor(
    private pubsub: PubSub,
    subscriptionName: string,
    private handler: MessageHandler
  ) {
    this.subscription = pubsub.subscription(subscriptionName, {
        flowControl: {
          maxMessages: pubsubConfig.flowControl.maxOutstandingMessages,
          maxBytes: pubsubConfig.flowControl.maxOutstandingBytes,
        },
      });
      
  }

  async start(): Promise<void> {
    if (this.isListening) {
      logger.warn('Subscriber already listening');
      return;
    }

    logger.info(`Starting subscriber: ${this.subscription.name}`);

    this.subscription.on('message', this.handleMessage.bind(this));
    this.subscription.on('error', this.handleError.bind(this));

    this.isListening = true;
    logger.info('✅ Subscriber started');
  }

  private async handleMessage(message: Message): Promise<void> {
    try {
      const data = JSON.parse(message.data.toString()) as PubSubMessage;
      
      logger.debug(`Received message ${data.id} from PubSub`);

      // Call the handler
      await this.handler(data);

      // Acknowledge the message
      message.ack();
      
      logger.debug(`Processed and acknowledged message ${data.id}`);
    } catch (error) {
      logError('Error processing message:', error);
      
      // Nack the message so it can be retried
      message.nack();
    }
  }

  private handleError(error: Error): void {
    logError('Subscriber error:', error);
  }

  async stop(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    logger.info('Stopping subscriber...');
    
    this.subscription.removeAllListeners();
    await this.subscription.close();
    
    this.isListening = false;
    logger.info('Subscriber stopped');
  }
}

// Get subscription statistics can't be accessed via ISubscription, find some other way to get stats
// async getStats(): Promise<{
//     numUndeliveredMessages: number;
//     oldestUnackedMessageAge: number;
//   }> {
//     try {
//       const [metadata] = await this.subscription.getMetadata();
      
//       return {
//         numUndeliveredMessages: parseInt(metadata.numUndeliveredMessages || '0'),
//         oldestUnackedMessageAge: parseInt(metadata.oldestUnackedMessageAge?.seconds || '0'),
//       };
//     } catch (error) {
//       logger.error('Failed to get subscription stats:', error);
//       return {
//         numUndeliveredMessages: 0,
//         oldestUnackedMessageAge: 0,
//       };
//     }
//   }