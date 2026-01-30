import type { ActionProposal, Advice } from '../../types';

export class ActionPlanner {
    plan(advice: Advice): ActionProposal {

      const target = advice.source.containerName;
        if (!target) {
          return {
            action: 'noop',
            target: 'unknown',
            reason: 'Missing container target',
            confidence: advice.confidence,
          };
      }

      const explanation = advice.explanation.toLowerCase();
        
      if (advice.confidence < 0.6) {
        return {
          action: 'noop',
          target: target,
          reason: 'Low confidence advice',
          confidence: advice.confidence,
        };
      }
  
      if (explanation.includes('memory')) {
        return {
          action: 'restart_container',
          target: target,
          reason: advice.explanation,
          confidence: advice.confidence,
        };
      }
  
      if (explanation.includes('scale')) {
        return {
          action: 'scale_container',
          target: target,
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