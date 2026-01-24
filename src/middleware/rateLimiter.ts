import { logger } from '../utils/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private cleanupInterval: Timer;

  constructor(
    private windowMs: number = 60000, // 1 minute default
    private maxRequests: number = 100
  ) {
    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  check(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      logger.warn(`Rate limit exceeded for key: ${key}`);
      return false;
    }

    entry.count++;
    return true;
  }

  reset(key: string): void {
    this.limits.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.limits.clear();
  }

  getStats(): {
    totalKeys: number;
    activeKeys: number;
  } {
    const now = Date.now();
    let active = 0;

    for (const entry of this.limits.values()) {
      if (now <= entry.resetTime) {
        active++;
      }
    }

    return {
      totalKeys: this.limits.size,
      activeKeys: active,
    };
  }
}
// Global rate limiter instance for log processing
export const logRateLimiter = new RateLimiter(1000, 1000);