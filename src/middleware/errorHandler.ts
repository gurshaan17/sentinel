import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DockerError extends AppError {
  constructor(message: string) {
    super(message, 500);
    this.name = 'DockerError';
  }
}

export class PubSubError extends AppError {
  constructor(message: string) {
    super(message, 500);
    this.name = 'PubSubError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export function handleError(error: Error): void {
  if (error instanceof AppError) {
    logger.error({
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      stack: error.stack,
    });
  } else {
    logger.error({
      name: 'UnhandledError',
      message: error.message,
      stack: error.stack,
    });
  }

  // If it's a non-operational error, we might want to exit
  if (error instanceof AppError && !error.isOperational) {
    logger.fatal('Non-operational error occurred. Shutting down...');
    process.exit(1);
  }
}

export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: any) => {
    logger.fatal('UNCAUGHT EXCEPTION! Shutting down...', error);
    handleError(error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error 
      ? reason 
      : new Error(String(reason));
    //@ts-ignore
    logger.fatal('UNHANDLED REJECTION! Shutting down...', error);
    handleError(error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
  });
}