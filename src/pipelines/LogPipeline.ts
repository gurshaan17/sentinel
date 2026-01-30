import type { ClassifiedLog } from '../types';
import { ContextBuilder } from '../services/ai/ContextBuilder';
import { AIService } from '../services/ai/AIService';
import { logger } from '../utils/logger';
import { AdviceBuilder } from '../services/ai/AdviceBuilder';
import { AdvisorService } from '../advisors/AdvisorService';

export class LogPipeline {
  private buffer: ClassifiedLog[] = [];
  private contextBuilder = new ContextBuilder();
  private ai = new AIService();
  private advisor = new AdvisorService();

  async ingest(log: ClassifiedLog): Promise<void> {
    this.buffer.push(log);

    // if (this.buffer.length < 5) return;

    const context = this.contextBuilder.build(this.buffer);
    this.buffer = [];

    const analysis = await this.ai.analyze(context);

    const advice = AdviceBuilder.fromAnalysis(analysis, log);

    if(advice){
        await this.advisor.handleAdvice(advice);
    }

    if (!analysis.shouldIgnore) {
        logger.info('AI Analysis', undefined, analysis);
    } else {
        console.log('[AI] Analysis ignored due to low confidence');
    }
  }
}