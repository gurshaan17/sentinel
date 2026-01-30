import { logger } from '../../utils/logger';

export class DockerActions {
  async restart(containerName: string): Promise<void> {
    logger.warn({ containerName }, 'Restarting container');
    // Placeholder — wire DockerService later
  }

  async scale(containerName: string, replicas: number): Promise<void> {
    logger.warn(
      { containerName, replicas },
      'Scaling container'
    );
  }
}