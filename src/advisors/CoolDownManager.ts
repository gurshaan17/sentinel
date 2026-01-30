import { logger } from '../utils/logger';

interface CooldownEntry {
  lastExecutedAt: number;
  cooldownMs: number;
}

export class CooldownManager {
  private cooldowns = new Map<string, CooldownEntry>();

  isAllowed(
    key: string,
    confidence: number,
    baseCooldownMs = 60_000
  ): boolean {
    const now = Date.now();

    const adaptiveCooldown =
      Math.round(baseCooldownMs * (1 / Math.max(confidence, 0.1)));

    const entry = this.cooldowns.get(key);

    if (!entry) {
      this.cooldowns.set(key, {
        lastExecutedAt: now,
        cooldownMs: adaptiveCooldown,
      });
      return true;
    }

    const elapsed = now - entry.lastExecutedAt;

    if (elapsed >= entry.cooldownMs) {
      this.cooldowns.set(key, {
        lastExecutedAt: now,
        cooldownMs: adaptiveCooldown,
      });
      return true;
    }

    logger.debug(
      {
        key,
        elapsed,
        remainingMs: entry.cooldownMs - elapsed,
        confidence,
      },
      '⏳ Action blocked by confidence-weighted cooldown'
    );

    return false;
  }
}