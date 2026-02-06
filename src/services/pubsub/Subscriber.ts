import { PubSub, Subscription, Message, v1, protos } from '@google-cloud/pubsub';
import type { PubSubMessage } from '../../types';
import { pubsubConfig } from '../../config/pubsub.config';
import { logger } from '../../utils/logger';
import { logError } from '../../utils/ErrorLogger';

export type MessageHandler = (message: PubSubMessage) => Promise<void> | void;

export class Subscriber {
  private subscription: Subscription;
  private isListening = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private isPulling = false;
  private pullClient: v1.SubscriberClient | null = null;

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

    this.isListening = true;

    const useStreamingPull =
      pubsubConfig.subscriber.useStreamingPull && !process.versions?.bun;

    if (!useStreamingPull && pubsubConfig.subscriber.useStreamingPull) {
      logger.warn(
        'Streaming pull disabled under Bun; falling back to polling pull mode.'
      );
    }

    if (useStreamingPull) {
      this.subscription.on('message', this.handleMessage.bind(this));
      this.subscription.on('error', this.handleError.bind(this));
    } else {
      await this.ensurePullClient();
      logger.info(
        `Subscriber using pull mode every ${pubsubConfig.subscriber.pullIntervalMs}ms`
      );
      this.startPullLoop();
    }

    logger.info('✅ Subscriber started');
  }

  private async ensurePullClient(): Promise<void> {
    if (this.pullClient) {
      return;
    }

    const options = await this.pubsub.getClientConfig();
    //@ts-ignore
    this.pullClient = new v1.SubscriberClient(options);
  }

  private startPullLoop(): void {
    const interval = pubsubConfig.subscriber.pullIntervalMs;
    this.pollTimer = setInterval(() => {
      void this.pullOnce();
    }, interval);

    // Kick off an immediate pull so we don't wait for the first interval.
    void this.pullOnce();
  }

  private async pullOnce(): Promise<void> {
    if (!this.isListening || this.isPulling || !this.pullClient) {
      return;
    }

    this.isPulling = true;

    try {
      const [response] = await this.pullClient.pull({
        subscription: this.subscription.name,
        maxMessages: pubsubConfig.subscriber.maxMessagesPerPull,
      });

      const receivedMessages = response.receivedMessages ?? [];
      if (!receivedMessages.length) {
        return;
      }

      for (const received of receivedMessages) {
        await this.handlePulledMessage(received);
      }
    } catch (error) {
      this.handleError(error as Error);
    } finally {
      this.isPulling = false;
    }
  }

  private async handlePulledMessage(
    received: protos.google.pubsub.v1.IReceivedMessage
  ): Promise<void> {
    const ackId = received.ackId;
    const message = received.message;

    if (!message?.data) {
      if (ackId) {
        await this.acknowledge([ackId]);
      }
      return;
    }

    try {
      const payloadBuffer = Buffer.from(message.data as Uint8Array);
      const data = JSON.parse(payloadBuffer.toString()) as PubSubMessage;

      if (data.log?.timestamp && !(data.log.timestamp instanceof Date)) {
        const parsedTimestamp = new Date(data.log.timestamp as unknown as string);
        if (Number.isNaN(parsedTimestamp.getTime())) {
          logError('Invalid log timestamp received from PubSub', {
            timestamp: data.log.timestamp,
            messageId: data.id,
          });
          if (ackId) {
            await this.nack([ackId]);
          }
          return;
        }
        data.log.timestamp = parsedTimestamp;
      }

      logger.debug(`Received message ${data.id} from PubSub`);

      await this.handler(data);

      if (ackId) {
        await this.acknowledge([ackId]);
      }

      logger.debug(`Processed and acknowledged message ${data.id}`);
    } catch (error) {
      logError('Error processing message:', error);

      if (ackId) {
        await this.nack([ackId]);
      }
    }
  }

  private async acknowledge(ackIds: string[]): Promise<void> {
    if (!this.pullClient || ackIds.length === 0) {
      return;
    }

    await this.pullClient.acknowledge({
      subscription: this.subscription.name,
      ackIds,
    });
  }

  private async nack(ackIds: string[]): Promise<void> {
    if (!this.pullClient || ackIds.length === 0) {
      return;
    }

    await this.pullClient.modifyAckDeadline({
      subscription: this.subscription.name,
      ackIds,
      ackDeadlineSeconds: 0,
    });
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
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.pullClient) {
      await this.pullClient.close();
      this.pullClient = null;
    }
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
