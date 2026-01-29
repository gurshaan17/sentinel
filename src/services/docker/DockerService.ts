import Docker from 'dockerode';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { ContainerManager } from './ContainerManager';
import { LogStreamer } from './LogStreamer';
import { logError } from '../../utils/ErrorLogger';
import type { DockerEvent } from '../../types';

export class DockerService {
  private docker: Docker;
  private containerManager: ContainerManager;
  private logStreamer: LogStreamer;

  constructor() {
    this.docker = new Docker(config.docker.socketPath 
      ? { socketPath: config.docker.socketPath }
      : { host: config.docker.host, port: config.docker.port }
    );
    
    this.containerManager = new ContainerManager(this.docker);
    this.logStreamer = new LogStreamer(this.docker);
  }

  async connect(): Promise<void> {
    try {
      await this.docker.ping();
      logger.info('✅ Connected to Docker daemon');
    } catch (error) {
      logError('❌ Failed to connect to Docker daemon:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    logger.info('Disconnecting from Docker');
    // Docker SDK doesn't require explicit disconnect
  }

  getContainerManager(): ContainerManager {
    return this.containerManager;
  }

  getLogStreamer(): LogStreamer {
    return this.logStreamer;
  }

  // Event listeners for container lifecycle
  async watchEvents(callback: (event: DockerEvent) => void): Promise<void> {
    const stream = await this.docker.getEvents();
    let buffer = '';

    stream.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (!line) continue;

        try {
          const event = JSON.parse(line) as DockerEvent;
          callback(event);
        } catch (error) {
          logError('Failed to parse Docker event line:', {
            line,
            error,
          });
        }
      }
    });

    stream.on('error', (error) => {
      logger.error('Docker event stream error:', error);
    });
  }
}