import { v4 as uuidv4 } from 'uuid';
import type { AIAnalysisResult, Advice } from '../../types';
import type { ClassifiedLog } from '../../types';

export class AdviceBuilder {
  static fromAnalysis(
    analysis: AIAnalysisResult,
    log: ClassifiedLog
  ): Advice | null {
    if (analysis.shouldIgnore) return null;

    return {
      id: uuidv4(),
      title: analysis.summary,
      explanation: analysis.suspectedCause ?? analysis.summary,
      recommendation: analysis.recommendation,
      severity:
        analysis.severity === 'high'
          ? 'critical'
          : analysis.severity === 'medium'
          ? 'warning'
          : 'info',
      confidence: analysis.confidence,
      source: {
        containerName: log.containerName,
        containerId: log.containerId,
      },
      timestamp: new Date().toISOString(),
    };
  }
}