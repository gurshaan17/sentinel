import type { ActionProposal } from '../types/action.types';

export class ActionPolicy {
  private readonly MIN_CONFIDENCE = 0.75;

  allow(proposal: ActionProposal): {
    allowed: boolean;
    reason?: string;
  } {
    if (proposal.action === 'noop') {
      return { allowed: false, reason: 'Noop action' };
    }

    if (proposal.confidence < this.MIN_CONFIDENCE) {
      return {
        allowed: false,
        reason: 'Confidence below threshold',
      };
    }

    return { allowed: true };
  }
}