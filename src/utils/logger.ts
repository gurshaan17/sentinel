import pino from 'pino';
import { loggerConfig } from '../config/logger.config';

export const logger = pino({
  level: loggerConfig.level,
  transport: loggerConfig.pretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          messageFormat: '{level} - {msg}',
        },
      }
    : undefined,
  
  // Redact sensitive data
  redact: loggerConfig.redact && {
    ...loggerConfig.redact,
    paths: [...loggerConfig.redact.paths],
  },
  
  // Custom serializers
  serializers: {
    error: pino.stdSerializers.err,
  },
});