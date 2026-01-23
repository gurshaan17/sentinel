import { dockerConfig } from "./docker.config";

export const config = {
    docker: dockerConfig,
    
    pubsub: {
      projectId: process.env.GCP_PROJECT_ID!,
      topicName: process.env.PUBSUB_TOPIC_NAME || 'sentinel-logs',
      subscriptionName: process.env.PUBSUB_SUBSCRIPTION_NAME || 'sentinel-workers',
      credentialsPath: process.env.GCP_CREDENTIALS_PATH,
    },
    
    monitoring: {
      pollInterval: 10000, // Check for new containers every 10s
      logBufferSize: 100,  // Buffer 100 logs before flushing
      maxLogsPerSecond: 1000,
    },
    
    filters: {
      includeLabels: process.env.INCLUDE_LABELS?.split(',') || [],
      excludeLabels: process.env.EXCLUDE_LABELS?.split(',') || ['sentinel.ignore=true'],
      includeImages: process.env.INCLUDE_IMAGES?.split(',') || [],
    },
    
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      pretty: process.env.NODE_ENV !== 'production',
    },
  } as const;
  
  // Validate required config
  if (!config.pubsub.projectId) {
    throw new Error('GCP_PROJECT_ID is required');
  }