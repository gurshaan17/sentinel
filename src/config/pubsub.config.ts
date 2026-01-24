export const pubsubConfig = {
    projectId: process.env.GCP_PROJECT_ID!,
    topicName: process.env.PUBSUB_TOPIC_NAME || 'sentinel-logs',
    subscriptionName: process.env.PUBSUB_SUBSCRIPTION_NAME || 'sentinel-workers',
    
    // Publishing options
    batching: {
      maxMessages: parseInt(process.env.PUBSUB_BATCH_SIZE || '100'),
      maxMilliseconds: parseInt(process.env.PUBSUB_BATCH_DELAY || '100'),
    },
    
    // Retry configuration
    retry: {
      retryCodes: [10, 13, 14], // ABORTED, INTERNAL, UNAVAILABLE
      backoffSettings: {
        initialRetryDelayMillis: 100,
        retryDelayMultiplier: 1.3,
        maxRetryDelayMillis: 60000,
      },
    },
    
    // Flow control
    flowControl: {
      maxOutstandingMessages: parseInt(process.env.PUBSUB_MAX_OUTSTANDING || '1000'),
      maxOutstandingBytes: parseInt(process.env.PUBSUB_MAX_BYTES || '104857600'), // 100MB
    },
} as const;
