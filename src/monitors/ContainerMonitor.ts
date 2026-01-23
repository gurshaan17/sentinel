import type { DockerService } from '../services/docker/DockerService';
import type { RawLog } from '../types';
import { logger } from '../utils/logger'
import { config } from '../config';

export class ContainerMonitor {
  private activeStreams = new Map<string, boolean>();
  private pollingInterval: Timer | null = null;

  constructor(private dockerService: DockerService) {}

  async start(onLog: (log: RawLog) => void | Promise<void>): Promise<void> {
    logger.info('Starting container monitor...');

    // Initial scan
    await this.scanContainers(onLog);

    // Poll for new containers
    this.pollingInterval = setInterval(async () => {
      await this.scanContainers(onLog);
    }, config.monitoring.pollInterval);

    // Watch for container events
    await this.dockerService.watchEvents(async (event) => {
      if (event.Type === 'container' && event.Action === 'start') {
        logger.info(`New container started: ${event.Actor.Attributes.name}`);
        await this.startStreamingContainer(event.Actor.ID, onLog);
      }
      
      if (event.Type === 'container' && (event.Action === 'stop' || event.Action === 'die')) {
        logger.info(`Container stopped: ${event.Actor.Attributes.name}`);
        this.stopStreamingContainer(event.Actor.ID);
      }
    });

    logger.info('✅ Container monitor started');
  }

  private async scanContainers(onLog: (log: RawLog) => void | Promise<void>): Promise<void> {
    const containers = await this.dockerService.getContainerManager().listContainers();

    for (const container of containers) {
      if (!this.activeStreams.has(container.id)) {
        await this.startStreamingContainer(container.id, onLog);
      }
    }
  }

  private async startStreamingContainer(
    containerId: string,
    onLog: (log: RawLog) => void | Promise<void>
  ): Promise<void> {
    if (this.activeStreams.has(containerId)) {
      return;
    }

    const container = await this.dockerService.getContainerManager().getContainer(containerId);
    if (!container) {
      return;
    }

    logger.info(`📡 Starting log stream for ${container.name}`);
    this.activeStreams.set(containerId, true);

    try {
      await this.dockerService.getLogStreamer().streamLogs(
        containerId,
        container.name,
        onLog
      );
    } catch (error: any) {
      logger.error(`Failed to stream logs for ${container.name}:`, error);
      this.activeStreams.delete(containerId);
    }
  }

  private stopStreamingContainer(containerId: string): void {
    this.activeStreams.delete(containerId);
    logger.debug(`Stopped streaming logs for container ${containerId}`);
  }

  async stop(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.activeStreams.clear();
    logger.info('Container monitor stopped');
  }
}