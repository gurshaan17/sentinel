import type { ActionProposal } from '../types/action.types';
import { config } from '../config';
import { logger } from '../utils/logger';

interface ActionHistory {
  timestamp: Date;
  action: string;
}

export class ActionPolicy {
  private readonly MIN_CONFIDENCE = 0.75;
  private actionHistory: ActionHistory[] = [];

  allow(proposal: ActionProposal): {
    allowed: boolean;
    reason?: string;
  } {
    // Check 1: Noop actions
    if (proposal.action === 'noop') {
      return { allowed: false, reason: 'Noop action' };
    }

    // Check 2: Confidence threshold
    if (proposal.confidence < this.MIN_CONFIDENCE) {
      return {
        allowed: false,
        reason: `Confidence ${proposal.confidence.toFixed(2)} below threshold ${this.MIN_CONFIDENCE}`,
      };
    }

    // Check 3: Safety mode
    if (config.safety.mode === 'disabled') {
      logger.warn('Safety checks disabled - allowing all actions');
      return { allowed: true };
    }

    // Check 4: Actions per hour limit
    const recentActions = this.getRecentActions(60 * 60 * 1000); // 1 hour
    if (recentActions.length >= config.safety.maxActionsPerHour) {
      return {
        allowed: false,
        reason: `Action limit reached: ${recentActions.length}/${config.safety.maxActionsPerHour} per hour`,
      };
    }

    // Check 5: Scaling limits
    if (proposal.action === 'scale_container') {
      const replicas = Number(proposal.params?.replicas);

      if (!Number.isFinite(replicas) || !Number.isInteger(replicas)) {
        return {
          allowed: false,
          reason: `Invalid replicas: ${proposal.params?.replicas}`,
        };
      }
      
      if (replicas > config.safety.maxScaleUp) {
        return {
          allowed: false,
          reason: `Scale up limit: requested ${replicas}, max ${config.safety.maxScaleUp}`,
        };
      }
      
      if (replicas < config.safety.maxScaleDown) {
        return {
          allowed: false,
          reason: `Scale down limit: requested ${replicas}, min ${config.safety.maxScaleDown}`,
        };
      }
    }

    // Check 6: Human approval required
    if (this.requiresHumanApproval(proposal)) {
      return {
        allowed: false,
        reason: 'Action requires human approval',
      };
    }

    // Record this action
    this.recordAction(proposal);

    return { allowed: true };
  }

  private requiresHumanApproval(proposal: ActionProposal): boolean {
    // Check if action type requires approval
    const actionDescription = `${proposal.action}:${proposal.target}`.toLowerCase();
    
    return config.safety.requireHumanApproval.some(
      pattern => actionDescription.includes(pattern.toLowerCase())
    );
  }

  private recordAction(proposal: ActionProposal): void {
    this.actionHistory.push({
      timestamp: new Date(),
      action: proposal.action,
    });
    
    // Cleanup old history (keep last 24 hours)
    this.cleanupHistory(24 * 60 * 60 * 1000);
  }

  private getRecentActions(windowMs: number): ActionHistory[] {
    const cutoff = Date.now() - windowMs;
    return this.actionHistory.filter(
      action => action.timestamp.getTime() > cutoff
    );
  }

  private cleanupHistory(maxAgeMs: number): void {
    const cutoff = Date.now() - maxAgeMs;
    this.actionHistory = this.actionHistory.filter(
      action => action.timestamp.getTime() > cutoff
    );
  }

  getStats() {
    return {
      totalActions: this.actionHistory.length,
      last24h: this.getRecentActions(24 * 60 * 60 * 1000).length,
      lastHour: this.getRecentActions(60 * 60 * 1000).length,
    };
  }
}
