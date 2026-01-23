import { logger } from './utils/logger';
import { ContainerMonitor } from './monitors/ContainerMonitor';
import { DockerService } from './services/docker';
import { PubSubService } from './services/pubsub';
import { LogParser } from './services/parser';
import { config } from './config';
import { logError } from './utils/ErrorLogger';

class Sentinel {
  private dockerService: DockerService;
  private pubsubService: PubSubService;
  private logParser: LogParser;
  private monitor: ContainerMonitor;

  constructor() {
    this.dockerService = new DockerService();
    this.pubsubService = new PubSubService();
    this.logParser = new LogParser();
    this.monitor = new ContainerMonitor(this.dockerService);
  }

  async start() {
    try {
      logger.info('🚀 Starting Sentinel...');

      // Initialize services
      await this.pubsubService.initialize();
      await this.dockerService.connect();

      // Start monitoring containers
      await this.monitor.start(async (log) => {
        // Parse log
        const parsed = this.logParser.parse(log);
        
        // Classify severity
        const classified = this.logParser.classify(parsed);
        
        // Publish to PubSub
        await this.pubsubService.publish(classified);
      });

      logger.info('✅ Sentinel is running');
    } catch (error) {
      logError('Failed to start Sentinel:', error);
      process.exit(1);
    }
  }

  async stop() {
    logger.info('Stopping Sentinel...');
    await this.monitor.stop();
    await this.dockerService.disconnect();
    await this.pubsubService.close();
    logger.info('Sentinel stopped');
  }
}

// Graceful shutdown
const sentinel = new Sentinel();

process.on('SIGTERM', async () => {
  await sentinel.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await sentinel.stop();
  process.exit(0);
});

// Start the application
sentinel.start();