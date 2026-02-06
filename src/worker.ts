import { logger } from './utils/logger';
import { PubSubService } from './services/pubsub/PubSubService';
import { LogWorker } from './workers';
import { config } from './config';
import { logError } from './utils/ErrorLogger';

class WorkerRunner {
  private pubsubService: PubSubService;
  private worker: LogWorker | null = null;

  constructor() {
    this.pubsubService = new PubSubService();
  }

  async start(): Promise<void> {
    try {
      logger.info('🚀 Starting LogWorker...');

      // PubSub client is enough for subscriptions; no need to initialize topic.
      this.worker = new LogWorker(
        this.pubsubService.getClient(),
        config.pubsub.subscriptionName
      );

      await this.worker.start();
      logger.info('✅ LogWorker is running');
      logger.info('Press Ctrl+C to stop');
    } catch (error) {
      logError('Failed to start LogWorker:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    logger.info('Stopping LogWorker...');

    if (this.worker) {
      await this.worker.stop();
    }

    await this.pubsubService.close();

    logger.info('LogWorker stopped');
  }
}

const runner = new WorkerRunner();

process.on('SIGTERM', async () => {
  await runner.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await runner.stop();
  process.exit(0);
});

runner.start();
