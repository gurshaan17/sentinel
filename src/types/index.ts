export * from './log.types';
export * from './docker.types';
export * from './pubsub.types';
export * from './action.types';
export * from './advice.types';
export * from './ai.types';
export * from './decision.types';

export interface ServiceHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
    lastCheck: Date;
    uptime: number;
  }
  
  export interface RetryOptions {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier?: number;
    maxDelayMs?: number;
  }
  
  export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
  }