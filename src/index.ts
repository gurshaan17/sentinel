import { logger } from './utils/logger';
import { ContainerMonitor } from './monitors/ContainerMonitor';
import { HealthCheck } from './monitors/HealthCheck';
import { DockerService } from './services/docker/DockerService';
import { PubSubService } from './services/pubsub/PubSubService';
import { LogParser } from './services/parser/LogParser';
import { LogClassifier } from './services/parser/LogClassifier';
import { config } from './config';
import { setupGlobalErrorHandlers } from './middleware/errorHandler';
import { logRateLimiter } from './middleware/rateLimiter';
import { logError } from './utils/ErrorLogger';
import { LogWorker } from './workers';

class Sentinel {
  private dockerService: DockerService;
  private pubsubService: PubSubService;
  private logParser: LogParser;
  private logClassifier: LogClassifier;
  private monitor: ContainerMonitor;
  private healthCheck: HealthCheck;
  private healthCheckTimer: Timer | null = null;
  private worker: LogWorker | null = null;

  constructor() {
    this.dockerService = new DockerService();
    this.pubsubService = new PubSubService();
    this.logParser = new LogParser();
    this.logClassifier = new LogClassifier();
    this.monitor = new ContainerMonitor(this.dockerService);
    this.healthCheck = new HealthCheck(
      this.dockerService,
      this.pubsubService,
      config.monitoring.healthCheckInterval
    );
  }

  async start() {
    try {
      logger.info('🚀 Starting Sentinel...');
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

      // Setup global error handlers
      setupGlobalErrorHandlers();

      // Initialize services
      logger.info('Initializing PubSub...');
      await this.pubsubService.initialize();

      logger.info('Connecting to Docker...');
      await this.dockerService.connect();

      logger.info('Starting LogWorker...');
      this.worker = new LogWorker(
        this.pubsubService.getClient(),
        config.pubsub.subscriptionName
      );
      await this.worker.start();

      // Start health checks
      logger.info('Starting health monitoring...');
      this.healthCheckTimer = this.healthCheck.startPeriodicChecks();

      // Start monitoring containers
      logger.info('Starting container monitoring...');
      await this.monitor.start(async (log) => {
        // Rate limiting
        const rateLimitKey = `${log.containerId}:${Date.now()}`;
        if (!logRateLimiter.check(rateLimitKey)) {
          logger.warn(`Rate limit exceeded for container ${log.containerName}`);
          return;
        }

        // Parse log
        const parsed = this.logParser.parse(log);
        
        // Classify severity
        const classified = this.logClassifier.classify(parsed);
        
        // Log classified message
        if (classified.severity === 'ERROR' || classified.severity === 'CRITICAL') {
          logger.error(`[${classified.containerName}] ${classified.message}`);
        } else if (classified.severity === 'WARNING') {
          logger.warn(`[${classified.containerName}] ${classified.message}`);
        } else {
          logger.debug(`[${classified.containerName}] ${classified.message}`);
        }
        
        // Publish to PubSub
        try {
          await this.pubsubService.publish(classified);
        } catch (error) {
          logError('Failed to publish log to PubSub:', error);
        }
      });

      logger.info('✅ Sentinel is running');
      logger.info(`Uptime: ${this.healthCheck.getUptimeFormatted()}`);
      logger.info('Press Ctrl+C to stop');
      
    } catch (error) {
      logError('Failed to start Sentinel:', error);
      process.exit(1);
    }
  }

  async stop() {
    logger.info('Stopping Sentinel...');
    
    // Stop health checks
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    if (this.worker) {
      await this.worker.stop();
    }  
    
    // Stop monitoring
    await this.monitor.stop();
    
    // Disconnect services
    await this.dockerService.disconnect();
    await this.pubsubService.close();
    
    logger.info(`Final uptime: ${this.healthCheck.getUptimeFormatted()}`);
    logger.info('Sentinel stopped');
  }
}

// Main execution
const sentinel = new Sentinel();

process.on('SIGTERM', async () => {
  await sentinel.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await sentinel.stop();
  process.exit(0);
});

sentinel.start();