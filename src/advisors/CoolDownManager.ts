import { logger } from '../utils/logger';

interface CooldownEntry {
  lastExecutedAt: number;
  cooldownMs: number;
}

export class CooldownManager {
  private cooldowns = new Map<string, CooldownEntry>();
  private maxIdleMs = 24 * 60 * 60 * 1000;
  private maxEntries = 10_000;

  isAllowed(
    key: string,
    confidence: number,
    baseCooldownMs = 60_000
  ): boolean {
    const now = Date.now();

    if (this.cooldowns.size > this.maxEntries) {
      for (const [k, v] of this.cooldowns) {
        if (now - v.lastExecutedAt > this.maxIdleMs) {
          this.cooldowns.delete(k);
        }
      }
    }

    const safeConfidence = Number.isFinite(confidence)
      ? Math.max(confidence, 0.1)
      : 0.1;
    const adaptiveCooldown = Math.round(baseCooldownMs * (1 / safeConfidence));

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