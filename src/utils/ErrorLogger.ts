import { logger } from './logger';

export function logError(message: string, error: unknown): void {
  if (error instanceof Error) {
    logger.error(
      {
        err: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      message
    );
  } else {
    logger.error(
      {
        err: {
          value: error,
        },
      },
      message
    );
  }
}
