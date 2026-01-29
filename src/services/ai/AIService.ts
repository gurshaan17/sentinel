import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import type { AIAnalysisResult, AIContext } from '../../types';
import { PromptBuilder } from './PromptBuilder';
import { logger } from '../../utils/logger';

export class AIService {
  private promptBuilder = new PromptBuilder();

  async analyze(context: AIContext): Promise<AIAnalysisResult> {
    const prompt = this.promptBuilder.build(context);

    const result = await generateText({
      model: google(process.env.AI_MODEL || 'gemini-1.5-flash'),
      prompt,
      //@ts-ignore
      maxTokens: Number(process.env.AI_MAX_TOKENS || 512),
    });

    try {
      const cleaned = result.text
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '');

      const parsed = JSON.parse(cleaned) as AIAnalysisResult;

      // Safety clamp
      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));

      if (parsed.confidence <
        Number(process.env.AI_CONFIDENCE_THRESHOLD || 0.6)
      ) {
        parsed.shouldIgnore = true;
      }

      return parsed;
    } catch (err) {
      logger.warn('AI response parse failed, ignoring result');
      return {
        summary: 'Unable to analyze logs',
        severity: 'low',
        confidence: 0,
        shouldIgnore: true,
      };
    }
  }
}