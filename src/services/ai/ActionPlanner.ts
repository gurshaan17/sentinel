import type { ActionProposal, Advice } from '../../types';

export class ActionPlanner {
    plan(advice: Advice): ActionProposal {
      if (advice.confidence < 0.6) {
        return {
          action: 'noop',
          target: advice.source.containerName ?? 'unknown',
          reason: 'Low confidence advice',
          confidence: advice.confidence,
        };
      }
  
      const explanation = advice.explanation.toLowerCase();
  
      if (explanation.includes('memory')) {
        return {
          action: 'restart_container',
          target: advice.source.containerName ?? 'unknown',
          reason: advice.explanation,
          confidence: advice.confidence,
        };
      }
  
      if (explanation.includes('scale')) {
        return {
          action: 'scale_container',
          target: advice.source.containerName ?? 'unknown',
          reason: advice.explanation,
          confidence: advice.confidence,
          params: { replicas: 2 },
        };
      }
  
      return {
        action: 'noop',
        target: advice.source.containerName ?? 'unknown',
        reason: 'No actionable recommendation',
        confidence: advice.confidence,
      };
    }
  }