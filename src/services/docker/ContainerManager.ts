import Docker from 'dockerode';
import type { ContainerInfo } from '../../types/docker.types';
import { logger } from '../../utils/logger';
import { config } from '../../config';
import { logError } from '../../utils/ErrorLogger';

export class ContainerManager {
  constructor(private docker: Docker) {}

  async listContainers(): Promise<ContainerInfo[]> {
    const containers = await this.docker.listContainers({ all: false });
    
    return containers
      .filter(this.shouldMonitor.bind(this))
      .map(this.mapContainerInfo);
  }

  private shouldMonitor(container: Docker.ContainerInfo): boolean {
    const labels = container.Labels || {};
    
    // Check exclude labels
    for (const excludeLabel of config.filters.excludeLabels) {
      const [key, value] = excludeLabel.split('=');
      if (labels[key] === value) {
        logger.debug(`Excluding container ${container.Names[0]} due to label ${excludeLabel}`);
        return false;
      }
    }

    // Check include labels (if specified)
    if (config.filters.includeLabels.length > 0) {
      const hasIncludeLabel = config.filters.includeLabels.some(includeLabel => {
        const [key, value] = includeLabel.split('=');
        return labels[key] === value;
      });
      
      if (!hasIncludeLabel) {
        return false;
      }
    }

    // Check include images (if specified)
    if (config.filters.includeImages.length > 0) {
      const matchesImage = config.filters.includeImages.some(pattern => 
        container.Image.includes(pattern)
      );
      
      if (!matchesImage) {
        return false;
      }
    }

    return true;
  }

  private mapContainerInfo(container: Docker.ContainerInfo): ContainerInfo {
    return {
      id: container.Id,
      name: container.Names[0].replace(/^\//, ''),
      image: container.Image,
      state: container.State,
      status: container.Status,
      created: new Date(container.Created * 1000),
      labels: container.Labels || {},
    };
  }

  async getContainer(id: string): Promise<ContainerInfo | null> {
    try {
      const container = this.docker.getContainer(id);
      const info = await container.inspect();
      
      return {
        id: info.Id,
        name: info.Name.replace(/^\//, ''),
        image: info.Config.Image,
        state: info.State.Status,
        status: info.State.Status,
        created: new Date(info.Created),
        labels: info.Config.Labels || {},
      };
    } catch (error) {
      logError(`Failed to get container ${id}:`, error);
      return null;
    }
  }
}