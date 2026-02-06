import { dockerConfig } from "./docker.config";
import { loggerConfig } from "./logger.config";
import { pubsubConfig } from "./pubsub.config";
import { safetyConfig } from "./safety.config";

export const config = {
    docker: dockerConfig,
    
    pubsub: pubsubConfig,
    
    monitoring: {
      pollInterval: 10000, // Check for new containers every 10s
      logBufferSize: 100,  // Buffer 100 logs before flushing
      maxLogsPerSecond: 1000,
      healthCheckInterval: 60000,
    },
    
    filters: {
      includeLabels: process.env.INCLUDE_LABELS?.split(',') || [],
      excludeLabels: process.env.EXCLUDE_LABELS?.split(',') || ['sentinel.ignore=true'],
      includeImages: process.env.INCLUDE_IMAGES?.split(',') || [],
    },
    
    logging: loggerConfig,

    safety: safetyConfig,
  } as const;
  
  // Validate required config
if (!config.pubsub.projectId) {
    throw new Error('GCP_PROJECT_ID is required');
}