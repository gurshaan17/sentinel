import Docker from 'dockerode';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { ContainerManager } from './ContainerManager';
import { LogStreamer } from './LogStreamer';
import { logError } from '../../utils/ErrorLogger';

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
  async watchEvents(callback: (event: Docker.EventMessage) => void): Promise<void> {
    const stream = await this.docker.getEvents();
    
    stream.on('data', (chunk: Buffer) => {
      try {
        const event = JSON.parse(chunk.toString()) as Docker.EventMessage;
        callback(event);
      } catch (error) {
        logError('Failed to parse Docker event:', error);
      }
    });

    stream.on('error', (error) => {
      logger.error('Docker event stream error:', error);
    });
  }
}