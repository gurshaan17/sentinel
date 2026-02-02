import { logger } from '../../utils/logger';
import type { DockerService } from '../docker/DockerService';

export class DockerActions {
  constructor(private dockerService: DockerService) {}

  async restart(containerName: string): Promise<void> {
    try {
      const containers = await this.dockerService
        .getContainerManager()
        .listContainers();
      
      const container = containers.find(c => c.name === containerName);
      
      if (!container) {
        throw new Error(`Container ${containerName} not found`);
      }
      
      const dockerContainer = this.dockerService['docker'].getContainer(container.id);
      await dockerContainer.restart();
      
      logger.info({ containerName, containerId: container.id }, 
        'Container restarted successfully');
    } catch (error) {
      logger.error({ containerName, error }, 
        'Failed to restart container');
      throw error;
    }
  }

  async scale(serviceName: string, replicas: number): Promise<void> {
    // Note: Scaling requires Docker Swarm or Kubernetes
    // For compose, you'd need to use docker-compose CLI
    throw new Error('Scaling not yet implemented - requires orchestrator');
  }
}