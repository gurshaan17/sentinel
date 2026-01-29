import type { ClassifiedLog } from '../types';
import { ContextBuilder } from '../services/ai/ContextBuilder';
import { AIService } from '../services/ai/AIService';
import { logger } from '../utils/logger';

export class LogPipeline {
  private buffer: ClassifiedLog[] = [];
  private contextBuilder = new ContextBuilder();
  private ai = new AIService();

  async ingest(log: ClassifiedLog): Promise<void> {
    this.buffer.push(log);

    // if (this.buffer.length < 5) return;

    const context = this.contextBuilder.build(this.buffer);
    this.buffer = [];

    const analysis = await this.ai.analyze(context);

    console.log('[AI] Raw analysis result:', analysis);

    if (!analysis.shouldIgnore) {
        //@ts-ignore
        logger.info('🤖 AI Analysis', analysis);
    } else {
        console.log('[AI] Analysis ignored due to low confidence');
    }
  }
}