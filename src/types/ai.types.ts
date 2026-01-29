import type { ClassifiedLog } from './log.types';

export interface AIContext {
  containerId: string;
  containerName: string;
  recentLogs: ClassifiedLog[];
  windowStart: string | Date;
  windowEnd: string | Date;
}

export interface AIAnalysisResult {
  summary: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  suspectedCause?: string;
  recommendation?: string;
  shouldIgnore: boolean;
}

export interface AIProviderConfig {
  model: string;
  maxTokens: number;
}