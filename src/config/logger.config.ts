export const loggerConfig = {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.NODE_ENV !== 'production',
    
    // Log file configuration
    file: {
      enabled: process.env.LOG_TO_FILE === 'true',
      path: process.env.LOG_FILE_PATH || './logs/sentinel.log',
      maxSize: '10m',
      maxFiles: 5,
    },
    
    // Redact sensitive information
    redact: {
      paths: ['*.password', '*.token', '*.secret', '*.apiKey'],
      censor: '[REDACTED]',
    },
    
    // Custom log levels
    customLevels: {
      docker: 35,
      pubsub: 35,
      ai: 35,
    },
} as const;