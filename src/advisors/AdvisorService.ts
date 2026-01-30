import { v4 as uuidv4 } from 'uuid';;
import type { AIAnalysisResult, Advice } from '../types';
import type { ClassifiedLog } from '../types';
import { logger } from '../utils/logger';
import { CooldownManager } from './CoolDownManager';
import { logDecision } from '../utils/explainWhyLogger';

export class AdvisorService {

  private cooldowns = new CooldownManager();

  generate(
    analysis: AIAnalysisResult,
    logs: ClassifiedLog[]
  ): Advice | null {
    // Hard safety gate
    if (analysis.shouldIgnore || analysis.confidence < 0.6) {
      logger.debug('Advisor: ignoring low-confidence analysis');
      return null;
    }

    const primaryLog = logs[0];

    return {
      id: uuidv4(),
      title: this.buildTitle(analysis),
      explanation: analysis.summary,
      recommendation: analysis.recommendation ?? undefined,
      severity: this.mapSeverity(analysis.severity),
      confidence: analysis.confidence,
      source: {
        containerName: primaryLog?.containerName,
        containerId: primaryLog?.containerId,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private buildTitle(analysis: AIAnalysisResult): string {
    switch (analysis.severity) {
      case 'high':
        return 'Critical issue detected';
      case 'medium':
        return 'Potential issue detected';
      default:
        return 'Informational insight';
    }
  }

  private mapSeverity(
    severity: AIAnalysisResult['severity']
  ): Advice['severity'] {
    if (severity === 'high') return 'critical';
    if (severity === 'medium') return 'warning';
    return 'info';
  }

  async handleAdvice(advice: Advice) {
    const decisionId = uuidv4();
    const containerKey =
      advice.source.containerId ?? advice.source.containerName ?? 'unknown';
    const cooldownKey = `advice:${containerKey}:${advice.title}`;

    const allowed = this.cooldowns.isAllowed(
      cooldownKey,
      advice.confidence,
      120_000
    );

    if (!allowed) {
      return;
    }

    logDecision({
      decisionId,
      action: advice.title,
      timestamp: new Date().toISOString(),
      explainWhy: {
        source: 'ai',
        confidence: advice.confidence,
        reasons: [
          advice.explanation,
          advice.recommendation
            ? `Suggested action: ${advice.recommendation}`
            : 'No direct action recommended',
        ],
        signals: {
          container: advice.source.containerName ?? advice.source.containerId ?? 'unknown',
          severity: advice.severity,
        },
      },
    });
  }
}