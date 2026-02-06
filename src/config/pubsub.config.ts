const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const pubsubConfig = {
    projectId: process.env.GCP_PROJECT_ID!,
    topicName: process.env.PUBSUB_TOPIC_NAME || 'logs',
    subscriptionName: process.env.PUBSUB_SUBSCRIPTION_NAME || 'logs-sub',
    
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
    
    // Subscriber behavior
    subscriber: {
      // Bun has known compatibility issues with Pub/Sub streaming pull.
      // Allow override via env for Node-only deployments.
      useStreamingPull:
        process.env.PUBSUB_USE_STREAMING_PULL !== undefined
          ? process.env.PUBSUB_USE_STREAMING_PULL === 'true'
          : !process.versions?.bun,
      pullIntervalMs: parsePositiveInt(process.env.PUBSUB_PULL_INTERVAL_MS, 1000),
      maxMessagesPerPull: parsePositiveInt(process.env.PUBSUB_PULL_MAX_MESSAGES, 20),
    },
} as const;
