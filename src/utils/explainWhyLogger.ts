import { logger } from './logger';
import type { DecisionLog } from '../types';

export function logDecision(decision: DecisionLog) {
  logger.info(
    {
      decisionId: decision.decisionId,
      action: decision.action,
      confidence: decision.explainWhy.confidence,
      source: decision.explainWhy.source,
      signals: decision.explainWhy.signals,
    },
    `Decision: ${decision.action}\n` +
      decision.explainWhy.reasons.map(r => `• ${r}`).join('\n')
  );
}