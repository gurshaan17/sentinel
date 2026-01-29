import { readFileSync } from 'fs';
import { logger } from './logger';

/**
 * Gets the current container ID if running inside Docker
 * Returns null if not running in a container
 */
export function getCurrentContainerId(): string | null {
  try {
    // Read cgroup to find container ID
    const cgroup = readFileSync('/proc/self/cgroup', 'utf8');
    
    // Docker containers have their ID in the cgroup path
    // Format: .../docker/<container-id> or .../<container-id>
    const dockerMatch = cgroup.match(/docker[\/-]([a-f0-9]{64})/);
    if (dockerMatch) {
      return dockerMatch[1];
    }
    
    // Try alternative format (cgroup v2 or containerd)
    const containerdMatch = cgroup.match(/([a-f0-9]{64})/);
    if (containerdMatch) {
      return containerdMatch[1];
    }
    
    return null;
  } catch (error) {
    // Not running in a container or can't read cgroup
    return null;
  }
}

/**
 * Gets the current container ID by inspecting the Docker socket
 * This is more reliable but requires Docker access
 */
export async function getCurrentContainerIdFromDocker(
  docker: any
): Promise<string | null> {
  try {
    const cgroupId = getCurrentContainerId();
    if (!cgroupId) {
      return null;
    }
    
    // Try to match by short ID (first 12 chars)
    const shortId = cgroupId.substring(0, 12);
    const containers = await docker.listContainers({ all: true });
    
    for (const container of containers) {
      if (container.Id.startsWith(cgroupId) || container.Id.startsWith(shortId)) {
        return container.Id;
      }
    }
    
    return null;
  } catch (error: any) {
    logger.debug('Could not get container ID from Docker:', error);
    return null;
  }
}
