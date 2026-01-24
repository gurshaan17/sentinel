import type { DockerService } from '../services/docker/DockerService';
import type { PubSubService } from '../services/pubsub/PubSubService';
import type { ServiceHealth } from '../types';
import { logError } from '../utils/ErrorLogger';
import { logger } from '../utils/logger';

export class HealthCheck {
  private startTime: Date;
  private lastDockerCheck: Date | null = null;
  private lastPubSubCheck: Date | null = null;

  constructor(
    private dockerService: DockerService,
    private pubsubService: PubSubService,
    private checkIntervalMs: number = 30000 // 30 seconds
  ) {
    this.startTime = new Date();
  }

  async checkDocker(): Promise<ServiceHealth> {
    try {
      await this.dockerService.connect();
      
      this.lastDockerCheck = new Date();
      
      return {
        status: 'healthy',
        message: 'Docker daemon is responsive',
        lastCheck: this.lastDockerCheck,
        uptime: Date.now() - this.startTime.getTime(),
      };
    } catch (error) {
      logError('Docker health check failed:', error);
      
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
      };
    }
  }

  async checkPubSub(): Promise<ServiceHealth> {
    try {
      // Simple check - try to get topic metadata
      await this.pubsubService.getPublisher();
      
      this.lastPubSubCheck = new Date();
      
      return {
        status: 'healthy',
        message: 'PubSub is responsive',
        lastCheck: this.lastPubSubCheck,
        uptime: Date.now() - this.startTime.getTime(),
      };
    } catch (error) {
      logError('PubSub health check failed:', error);
      
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
      };
    }
  }

  async checkAll(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      docker: ServiceHealth;
      pubsub: ServiceHealth;
    };
  }> {
    const [dockerHealth, pubsubHealth] = await Promise.all([
      this.checkDocker(),
      this.checkPubSub(),
    ]);

    let overall: 'healthy' | 'degraded' | 'unhealthy';

    if (dockerHealth.status === 'healthy' && pubsubHealth.status === 'healthy') {
      overall = 'healthy';
    } else if (dockerHealth.status === 'unhealthy' || pubsubHealth.status === 'unhealthy') {
      overall = 'unhealthy';
    } else {
      overall = 'degraded';
    }

    return {
      overall,
      services: {
        docker: dockerHealth,
        pubsub: pubsubHealth,
      },
    };
  }

  startPeriodicChecks(): Timer {
    logger.info(`Starting periodic health checks every ${this.checkIntervalMs}ms`);
    
    return setInterval(async () => {
      const health = await this.checkAll();
      
      logger.info('Health check results:', {
        overall: health.overall,
        docker: health.services.docker.status,
        pubsub: health.services.pubsub.status,
      });

      if (health.overall === 'unhealthy') {
        logger.error('System is unhealthy!', health);
      } else if (health.overall === 'degraded') {
        logger.warn('System is degraded', health);
      }
    }, this.checkIntervalMs);
  }

  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  getUptimeFormatted(): string {
    const uptime = this.getUptime();
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}