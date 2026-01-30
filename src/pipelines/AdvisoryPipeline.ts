import { AIService } from '../services/ai/AIService';
import { AdvisorService } from '../advisors/AdvisorService';
import { ContextBuilder } from '../services/ai/ContextBuilder';
import type { ClassifiedLog } from '../types';
import { logger } from '../utils/logger';
import { ActionPipeline } from './ActionPipeline';

export class AdvisoryPipeline {
  private ai = new AIService();
  private advisor = new AdvisorService();
  private contextBuilder = new ContextBuilder();
  private actionPipeline = new ActionPipeline();

  async process(logs: ClassifiedLog[]): Promise<void> {
    if (logs.length === 0) return;

    const context = this.contextBuilder.build(logs);

    const analysis = await this.ai.analyze(context);

    const advice = this.advisor.generate(analysis, logs);

    if (!advice) {
      logger.debug('No advisory generated');
      return;
    }

    await this.actionPipeline.handle(advice);
    
    this.emit(advice);
  }

  private emit(advice: unknown): void {
    logger.info({ advice }, '🧠 AI Advisory generated');
  }
}